from typing import Dict, Any, List

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
from langchain_core.runnables.config import RunnableConfig
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.store.base import BaseStore
from langgraph.store.memory import InMemoryStore

# Chatbot instruction
MODEL_SYSTEM_MESSAGE = """Eres un asistente comercial de DMC útil con memoria que proporciona información sobre los cursos del instituto DMC.
DMC es un centro de enseñanza enfocada en Data Science y Data Analytics.
Tu nombre es Chatbot DMC.
Las especializaciones se encuentran en este link: https://dmc.pe/cursos/?_filtro_categorias_productos=especializaciones
Si tienes memoria para este usuario, úsala para personalizar tus respuestas.
Aquí está la memoria (puede estar vacía): {memory}"""

# Create new memory from the chat history and any existing memory
CREATE_MEMORY_INSTRUCTION = """Estás recopilando información sobre el usuario para personalizar tus respuestas.

INFORMACIÓN ACTUAL DEL USUARIO:
{memory}
INSTRUCCIONES:

1. Revisa cuidadosamente el historial del chat a continuación.
2. Identifica nueva información sobre el usuario, como:
   - Detalles personales (nombre, ubicación)
   - Preferencias (gustos, aversiones)
   - Intereses y pasatiempos
   - Experiencias pasadas
   - Metas o planes futuros
3. Combina cualquier información nueva con la memoria existente.
4. Formatea la memoria como una lista clara de viñetas.
5. Si la nueva información entra en conflicto con la memoria existente, conserva la versión más reciente.

Recuerda: Solo incluye información objetiva directamente declarada por el usuario. No hagas suposiciones ni inferencias.

Basándote en el historial del chat a continuación, actualiza la información del usuario:"""


class ChatbotGraph:
    def __init__(self, chat_model: BaseChatModel):
        self.model = chat_model
        
        # Store for long-term (across-thread) memory
        self.across_thread_memory = InMemoryStore()
        
        # Checkpointer for short-term (within-thread) memory
        self.within_thread_memory = MemorySaver()
        
        # Construir y compilar el grafo
        self.graph = self._build_graph()
        
        # Diccionario para almacenar los thread_ids por usuario
        self.user_threads = {}
        
    def _build_graph(self):
        
        def call_model(state: MessagesState, config: RunnableConfig, store: BaseStore):
            
            # Get the user ID from the config
            user_id = config["configurable"]["user_id"]

            # Retrieve memory from the store
            namespace = ("memory", user_id)
            key = "user_memory"
            existing_memory = store.get(namespace, key)

            # Extract the actual memory content if it exists
            if existing_memory:
                existing_memory_content = existing_memory.value.get('memory')
            else:
                existing_memory_content = "No existing memory found."

            # Format the memory in the system prompt
            system_msg = MODEL_SYSTEM_MESSAGE.format(memory=existing_memory_content)
            
            response = self.model.invoke([SystemMessage(content=system_msg)] + state["messages"])

            return {"messages": response}

        def write_memory(state: MessagesState, config: RunnableConfig, store: BaseStore):
            user_id = config["configurable"]["user_id"]
            namespace = ("memory", user_id)
            existing_memory = store.get(namespace, "user_memory")
                
            if existing_memory:
                existing_memory_content = existing_memory.value.get('memory')
            else:
                existing_memory_content = "No existing memory found."

            system_msg = CREATE_MEMORY_INSTRUCTION.format(memory=existing_memory_content)
            new_memory = self.model.invoke([SystemMessage(content=system_msg)] + state['messages'])

            key = "user_memory"
            store.put(namespace, key, {"memory": new_memory.content})
            
            return state

        # Define the graph
        builder = StateGraph(MessagesState)
        builder.add_node("call_model", call_model)
        builder.add_node("write_memory", write_memory)
        builder.add_edge(START, "call_model")
        builder.add_edge("call_model", "write_memory")
        builder.add_edge("write_memory", END)

        # Compile the graph with the checkpointer and store
        return builder.compile(
            checkpointer=self.within_thread_memory, 
            store=self.across_thread_memory
        )
    
    def process_message(self, message: str, user_id: str) -> Dict[str, Any]:
        config = {"configurable": {"thread_id": user_id, "user_id": user_id}}

        input_messages = [HumanMessage(content=message)]

        result = self.graph.invoke({"messages": input_messages}, config)
        
        ai_message = result["messages"][-1]
        
        return {
            "answer": ai_message.content,
            "user": user_id,
            "thread_id": user_id
        }
    
    def get_chat_history(self, user_id: str) -> List[Dict[str, Any]]:
        thread = {"configurable": {"thread_id": user_id}}
        state = self.graph.get_state(thread).values

        if not state:
            return []
        
        # Convertir los mensajes a un formato más simple para la API
        formatted_messages = []
        for m in state["messages"]: 
            if isinstance(m, BaseMessage):
                formatted_messages.append({
                    "role": m.type,
                    "content": m.content
                })
        
        return formatted_messages

    def get_memory(self, user_id: str) -> Dict[str, Any]:
        namespace = ("memory", user_id)
        existing_memory = self.across_thread_memory.get(namespace, "user_memory")

        if not existing_memory:
            return f"No se encontró memoria para el usuario {user_id}."

        return existing_memory.value['memory']
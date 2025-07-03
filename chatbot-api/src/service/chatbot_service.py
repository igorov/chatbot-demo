from typing import Dict, Any
import os
import datetime
from src.llm.llm_factory import LLMFactory
from src.service.chat_graph import ChatbotGraph

class ChatbotService:
    _chatbot_graph = None
    
    @classmethod
    def set_chatbot_graph(cls, graph: ChatbotGraph):
        cls._chatbot_graph = graph
    
    @classmethod
    def get_chatbot_graph(cls) -> ChatbotGraph:
        if cls._chatbot_graph is None:
            # Mensaje de advertencia - la inicialización debería hacerse en main.py
            print("ADVERTENCIA: Inicializando el grafo bajo demanda. "
                  "Es preferible inicializarlo en main.py para un mejor control.")
            
            # Crear modelo de chat (fallback para compatibilidad)
            chat_model = LLMFactory().create_chat_model(os.getenv('MODEL_PROVIDER', 'huggingface'))
            
            # Inicializar el grafo con el modelo
            cls._chatbot_graph = ChatbotGraph(chat_model)
            
        return cls._chatbot_graph
    
    @classmethod
    async def process_question(cls, question: str, user: str) -> Dict[str, Any]:
        graph = cls.get_chatbot_graph()
        result = graph.process_message(question, user)
        
        # Agregar timestamp a la respuesta
        current_time = datetime.datetime.now().isoformat()
        result["processed_timestamp"] = current_time
        
        return result
    
    @classmethod
    async def get_chat_history(cls, user: str) -> Dict[str, Any]:
        graph = cls.get_chatbot_graph()
        history = graph.get_chat_history(user)
        
        return {
            "user": user,
            "messages": history
        }

    @classmethod
    async def get_memory(cls, user: str) -> Dict[str, Any]:
        graph = cls.get_chatbot_graph()
        memory = graph.get_memory(user)
        
        return {
            "user": user,
            "memory": memory
        }

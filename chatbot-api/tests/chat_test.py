from src.llm.llm_factory import LLMFactory
import os
from src.service.chat_graph import ChatbotGraph

model_provider = "openai"
os.environ['OPENAI_API_KEY'] = "XXX"
chat_model = LLMFactory().create_chat_model(model_provider)

# Inicializacion del grafo con el modelo
chatbot_graph = ChatbotGraph(chat_model)


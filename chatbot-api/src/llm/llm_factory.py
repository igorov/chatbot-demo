from enum import Enum
from typing import Union, Optional, Dict, Any
from langchain_openai import ChatOpenAI
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
import os

class LLMProvider(Enum):
    HUGGINGFACE = "huggingface"
    OPENAI = "openai"

class LLMFactory:
    def __init__(self):
        self.default_configs = {
            LLMProvider.HUGGINGFACE: {
                "repo_id": "meta-llama/Llama-3.3-70B-Instruct",
                "task": "text-generation",
                "max_new_tokens": 512,
                "do_sample": False,
                "repetition_penalty": 1.03,
                "verbose": True
            },
            LLMProvider.OPENAI: {
                "model": "gpt-4o-mini",
                "temperature": 0.7,
                "max_tokens": 512,
                "verbose": True
            }
        }
    
    def create_chat_model(
        self, 
        provider: Union[LLMProvider, str],
        model_name: Optional[str] = None,
        **kwargs
    ) -> Union[ChatHuggingFace, ChatOpenAI]:
        # Convertir string a enum si es necesario
        if isinstance(provider, str):
            provider = LLMProvider(provider.lower())
        
        # Obtener configuración por defecto
        config = self.default_configs[provider].copy()
        
        # Actualizar con parámetros personalizados
        config.update(kwargs)
        
        # Actualizar modelo específico si se proporciona
        if model_name:
            if provider == LLMProvider.HUGGINGFACE:
                config["repo_id"] = model_name
            else:
                config["model"] = model_name
        
        # Crear el modelo correspondiente
        if provider == LLMProvider.HUGGINGFACE:
            return self._create_huggingface_chat(config)
        elif provider == LLMProvider.OPENAI:
            return self._create_openai_chat(config)
        else:
            raise ValueError(f"Proveedor no soportado: {provider}")
    
    def _create_huggingface_chat(self, config: Dict[str, Any]) -> ChatHuggingFace:
        """Crea un modelo ChatHuggingFace"""
        verbose = config.pop("verbose", False)
        
        llm = HuggingFaceEndpoint(**config)
        return ChatHuggingFace(llm=llm, verbose=verbose)
    
    def _create_openai_chat(self, config: Dict[str, Any]) -> ChatOpenAI:
        """Crea un modelo ChatOpenAI"""
        # Verificar API key
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY no está configurada")
        
        return ChatOpenAI(**config)
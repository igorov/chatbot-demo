from fastapi import APIRouter
from src.controller.chatbot_controller import ChatbotController, ChatbotRequest

router = APIRouter(prefix="/api", tags=["chatbot"])

@router.post("/chatbot", summary="Process chatbot question")
async def chatbot_endpoint(request: ChatbotRequest):
    return await ChatbotController.process_chatbot_request(request)

@router.get("/chatbot/history", summary="Get chat history")
async def chatbot_history_endpoint(user: str):
    return await ChatbotController.get_chat_history(user)

@router.get("/chatbot/memory", summary="Get chat memory")
async def chatbot_memory_endpoint(user: str):
    return await ChatbotController.get_memory(user)

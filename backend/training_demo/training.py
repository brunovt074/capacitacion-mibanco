from copy import deepcopy

from training_demo.cases import CASES


WELCOME = (
    "*¡Bienvenido a la demo de capacitación MiBanco!*\n\n"
    "Vas a recorrer dos casos del diagnóstico inicial. Mirá cada video y respondé acá, en WhatsApp.\n"
    "No ingreses datos personales ni información de clientes.\n\n"
    "Escribí *CONTINUAR* para comenzar.\n"
    "Podés consultar *ESTADO* o escribir *REINICIAR* para empezar de nuevo."
)


def display(state: dict, video_base: str, business_number: str | None = None) -> str:
    phase = state["phase"]
    if phase == "welcome":
        return WELCOME
    if phase == "done":
        score = sum(answer["points"] for answer in state["answers"])
        results = "\n".join(
            f"Caso {index + 1}: {answer['category']} ({answer['points']}/2)"
            for index, answer in enumerate(state["answers"])
        )
        critical = "\nUna respuesta requiere revisión por error crítico." if any(
            answer["category"] == "Error Crítico" for answer in state["answers"]
        ) else ""
        return (
            f"*Diagnóstico inicial completado*\n\n{results}\n\n*Resultado: {score}/4*{critical}\n\n"
            "Este puntaje es demostrativo: no determina aprobación ni certificación.\n"
            "Las siguientes semanas de aprendizaje y evaluación no están habilitadas en esta demo.\n\n"
            "Escribí *ESTADO* para consultar el resultado o *REINICIAR* para repetir."
        )
    case = CASES[state["case"]]
    heading = f"*Caso {state['case'] + 1}/2 — {case['title']}*"
    if phase == "video":
        return_number = f"&whatsapp={business_number}" if business_number else ""
        return (
            f"{heading}\n\nMirá el video y el contexto del caso:\n"
            f"{video_base.rstrip('/')}/video.html?case={case['id']}{return_number}\n\n"
            "Cuando termines, volvé a este chat y escribí *CONTINUAR* para responder."
        )
    options = "\n\n".join(f"*{option['id']}.* {option['text']}" for option in case["options"])
    return f"{heading}\n\n{case['question']}\n\n{options}\n\nRespondé *A, B, C o D*."


def advance(previous: dict | None, text: str, video_base: str, business_number: str | None = None) -> tuple[dict | None, str | None]:
    command = text.strip().upper()
    if previous is None and command != "MIBANCO":
        return None, None
    if previous is None or command == "REINICIAR":
        state = {"phase": "welcome", "case": 0, "answers": []}
        return state, display(state, video_base, business_number)
    state = deepcopy(previous)
    phase = state["phase"]
    if command in {"MIBANCO", "HOLA", "ESTADO", "MENU", "MENÚ"}:
        return state, display(state, video_base, business_number)
    if phase == "done":
        return state, display(state, video_base, business_number)
    if command == "CONTINUAR" and phase in {"welcome", "video"}:
        state["phase"] = "video" if phase == "welcome" else "question"
        return state, display(state, video_base, business_number)
    if phase == "question" and command in {"A", "B", "C", "D"}:
        case = CASES[state["case"]]
        option = next(option for option in case["options"] if option["id"] == command)
        state["answers"].append({
            "case_id": case["id"], "answer": command,
            "points": option["points"], "category": option["category"],
        })
        state["case"] += 1
        state["phase"] = "done" if state["case"] == len(CASES) else "video"
        return state, f"Respuesta *{command}* registrada.\n\n{display(state, video_base, business_number)}"
    instruction = "Respondé A, B, C o D." if phase == "question" else "Escribí CONTINUAR para avanzar."
    return state, f"{instruction}\n\n{display(state, video_base, business_number)}"

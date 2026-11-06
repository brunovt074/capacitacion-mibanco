from copy import deepcopy


VIDEO_BASE = "https://video.example"


def test_two_case_diagnosis_scores_each_answer_and_finishes_without_certification():
    from training_demo.training import advance

    state, welcome = advance(None, "mibanco", VIDEO_BASE)
    assert state["phase"] == "welcome"
    state, video = advance(state, "CONTINUAR", VIDEO_BASE)
    assert "https://video.example/video.html?case=MB-CN-C01" in video
    assert state["phase"] == "video"
    state, question = advance(state, "CONTINUAR", VIDEO_BASE)
    assert state["phase"] == "question"
    assert all(f"{letter}." in question for letter in "ABCD")
    state, next_video = advance(state, "B", VIDEO_BASE)
    assert state["answers"] == [{"case_id": "MB-CN-C01", "answer": "B", "points": 1, "category": "En desarrollo"}]
    assert "case=MB-CN-C02" in next_video
    state, _ = advance(state, "CONTINUAR", VIDEO_BASE)
    state, result = advance(state, "D", VIDEO_BASE)
    assert state["phase"] == "done"
    assert state["answers"][1] == {"case_id": "MB-CN-C02", "answer": "D", "points": 0, "category": "Error Crítico"}
    assert "1/4" in result
    state_before = deepcopy(state)
    state, _ = advance(state, "A", VIDEO_BASE)
    assert state == state_before


def test_answer_cannot_skip_video_or_welcome_and_unknown_text_cannot_start_session():
    from training_demo.training import advance

    assert advance(None, "quiero un turno", VIDEO_BASE) == (None, None)
    assert advance(None, "REINICIAR", VIDEO_BASE) == (None, None)
    assert advance(None, "HOLA", VIDEO_BASE) == (None, None)
    state, _ = advance(None, "MIBANCO", VIDEO_BASE)
    before = deepcopy(state)
    state, _ = advance(state, "A", VIDEO_BASE)
    assert state == before
    state, _ = advance(state, "CONTINUAR", VIDEO_BASE)
    before = deepcopy(state)
    state, _ = advance(state, "B", VIDEO_BASE)
    assert state == before


def test_hola_and_estado_resume_without_erasing_completed_answers():
    from training_demo.training import advance

    state, _ = advance(None, "MIBANCO", VIDEO_BASE)
    for command in ["CONTINUAR", "CONTINUAR", "A"]:
        state, _ = advance(state, command, VIDEO_BASE)
    before = deepcopy(state)
    state, reply = advance(state, "HOLA", VIDEO_BASE)
    assert state == before
    assert "case=MB-CN-C02" in reply
    state, reply = advance(state, "ESTADO", VIDEO_BASE)
    assert state == before
    assert "case=MB-CN-C02" in reply
    state, _ = advance(state, "REINICIAR", VIDEO_BASE)
    assert state["phase"] == "welcome"
    assert state["answers"] == []


def test_invalid_answer_does_not_advance_or_mutate_callers_state():
    from training_demo.training import advance

    state, _ = advance(None, "MIBANCO", VIDEO_BASE)
    for command in ["CONTINUAR", "CONTINUAR"]:
        state, _ = advance(state, command, VIDEO_BASE)
    before = deepcopy(state)
    result, _ = advance(state, "E", VIDEO_BASE)
    assert result == before
    result, _ = advance(state, "C", VIDEO_BASE)
    assert state == before
    assert result["answers"][0]["points"] == 0

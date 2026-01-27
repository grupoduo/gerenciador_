/**
 * @param {any[]} raw_answers
 */
export default (raw_answers) => {
    for (const answer of raw_answers) {
        if(answer.question.question_type === "phone")
        return answer
    }
    return null
}
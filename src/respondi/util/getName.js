/**
 * @param {any[]} raw_answers
 */
export default (raw_answers) => {
    for (const answer of raw_answers) {
        if(answer.question.question_type === "name")
        return answer
    }
    return null
}
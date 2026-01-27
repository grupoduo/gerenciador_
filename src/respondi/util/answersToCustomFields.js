export default (respondent, answerFieldsMap) => {
    const answers = {}
    respondent.raw_answers.forEach(answer => {
        // Store answers keyed by question_id, handling array values
        answers[answer.question.question_id] =
            Array.isArray(answer.answer) ? answer.answer.join(', ') :
                answer.question.question_type === "phone" ?
                    `${answer.answer.country}${answer.answer.phone}` :
                    answer.answer;
    });

    const custom_fields_values = []

    for (const key in answers) {
        if (key === "xopyalskloic") continue;
        if(!answerFieldsMap[key]) continue;
        custom_fields_values.push({
            "field_id": answerFieldsMap[key],
            "values": [
                {
                    "value": answers[key]
                }
            ]
        })
    }
    return {name: answers["xopyalskloic"], custom_fields_values}
}
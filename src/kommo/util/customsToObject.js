export default (lead) => {
    const custom_fields = {}
    if(!lead) return custom_fields
    if(!lead.custom_fields && !lead.custom_fields_values)
        return custom_fields;
    if(lead.custom_fields)
        lead.custom_fields.forEach(c => custom_fields[c.id] = c)
    else lead.custom_fields_values.forEach(c => custom_fields[c.field_id] = c)
    return custom_fields;
}
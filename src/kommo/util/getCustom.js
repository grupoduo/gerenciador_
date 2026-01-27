export default (lead, field_id, field_name) => {
	const [custom_fields_key, id_key] = lead.custom_fields ? ["custom_fields", "id"] : ["custom_fields_values", "field_id"];
	const custom_fields = lead[custom_fields_key];
	if(!custom_fields) return null;
	const field = custom_fields.find(c => c[id_key] === field_id);
	return field ? field.values[0][field_name] : null;
};
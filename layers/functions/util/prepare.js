const flattenObject = (obj, parentKey = '', res = {}) => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newKey = parentKey ? `${parentKey}_${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattenObject(value, newKey, res);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          flattenObject(item, `${newKey}_${index}`, res);
        });
      } else {
        res[newKey] = value;
      }
    }
  }
  return res;
}

const ensureKeys = (obj, keys) => {
  const result = {};
  keys.forEach(key => {
    result[key] = obj[key] !== undefined ? obj[key] : '';
  });
  return result;
}

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19)//.replace('T', ' ');
}

const cleanData = (data) => {
  return {
    ...data,
    ticketCount: data.ticketCount === 'null' ? null : (parseInt(data.ticketCount) || 0),
    amount: parseFloat(data.amount) || 0,
    date: formatDate(data.date),
    combo: data.combo === 1 ? 1 : 0 // Garantindo que combo seja 0 ou 1
  };
}

const clean = (rows) => {

  if (rows.length === 0) {
    console.log('Nenhum novo registro para inserir.');
    return;
  }

  return rows.map(row => ({
    date: row.date,
    amount: row.amount,
    item_id: row.item_id,
    item_type: row.item_type,
    ticketCount: row.ticketCount,
    concept: row.concept,
    lastUpdate: row.lastUpdate,
    purchase_deliveryMethod: row.purchase_deliveryMethod,
    purchase_ipAddress: row.purchase_ipAddress,
    purchase_channel_pointOfSale_id: row.purchase_channel_pointOfSale_id,
    purchase_channel_pointOfSale_name: row.purchase_channel_pointOfSale_name,
    purchase_channel_name: row.purchase_channel_name,
    purchase_channel_id: row.purchase_channel_id,
    purchase_channel_type: row.purchase_channel_type,
    purchase_channel_operator_id: row.purchase_channel_operator_id,
    purchase_channel_operator_email: row.purchase_channel_operator_email,
    purchase_id: row.purchase_id,
    purchase_billingAddress_country: row.purchase_billingAddress_country,
    purchase_billingAddress_zipCode: row.purchase_billingAddress_zipCode,
    purchase_billingAddress_streetNumber: row.purchase_billingAddress_streetNumber,
    purchase_billingAddress_city: row.purchase_billingAddress_city,
    purchase_billingAddress_street: row.purchase_billingAddress_street,
    purchase_billingAddress_neighborhood: row.purchase_billingAddress_neighborhood,
    purchase_billingAddress_state: row.purchase_billingAddress_state,
    purchase_user_firstName: row.purchase_user_firstName,
    purchase_user_lastName: row.purchase_user_lastName,
    purchase_user_documentType: row.purchase_user_documentType,
    purchase_user_documentNumber: row.purchase_user_documentNumber,
    purchase_user_email: row.purchase_user_email,
    name: row.name,
    payment_interestRate: row.payment_interestRate,
    payment_interestAmount: row.payment_interestAmount,
    payment_terminalNumber: row.payment_terminalNumber,
    payment_method: row.payment_method,
    payment_amount: row.payment_amount,
    payment_authorizationCode: row.payment_authorizationCode,
    payment_merchantId: row.payment_merchantId,
    payment_id: row.payment_id,
    payment_type: row.payment_type,
    payment_uuid: row.payment_uuid,
    payment_instalments: row.payment_instalments,
    payment_card_lastFourDigits: row.payment_card_lastFourDigits,
    payment_card_firstSixDigits: row.payment_card_firstSixDigits,
    payment_card_brand: row.payment_card_brand,
    payment_gatewayId: row.payment_gatewayId,
    payment_batchNumber: row.payment_batchNumber,
    Movement_id: row.id,
    event_venue_country: row.event_venue_country,
    event_venue_city: row.event_venue_city,
    event_venue_name: row.event_venue_name,
    event_venue_id: row.event_venue_id,
    event_venue_state: row.event_venue_state,
    event_name: row.event_name,
    event_client_name: row.event_client_name,
    event_client_id: row.event_client_id,
    event_id: row.event_id,
    event_category_name: row.event_category_name,
    event_category_id: row.event_category_id,
    operation: row.operation,
    refund_date: row.refund_date,
    refund_amount: row.refund_amount,
    refund_uuid: row.refund_uuid,
    refund_gatewayId: row.refund_gatewayId,
    product_name: row.product_name,
    product_id: row.product_id,
    tickets_show_name: row.tickets_show_name,
    tickets_show_id: row.tickets_show_id,
    tickets_show_startDate: formatDate(row.tickets_show_startDate),
    tickets_id: row.tickets_id,
    tickets_sector_name: row.tickets_sector_name,
    tickets_sector_id: row.tickets_sector_id,
    rate_name: row.rate_name,
    rate_id: row.rate_id,
    rate_category_name: row.rate_category_name,
    rate_category_id: row.rate_category_id,
    lastUpdateSearch: row.lastUpdateSearch,
    lastUpdateSearchNext: row.lastUpdateSearchNext,
    lastMovementIdSearch: row.lastMovementIdSearch,
    lastMovementIdNext: row.lastMovementIdNext,
    combo: row.combo,
    insertion_datetime: formatDate(new Date().toISOString())
  }));
};

exports.data = async (movements) => {

  const headers = [
    'date', 'amount', 'item_id', 'item_type', 'ticketCount', 'concept', 'lastUpdate',
    'purchase_deliveryMethod', 'purchase_ipAddress', 'purchase_channel_pointOfSale_id',
    'purchase_channel_pointOfSale_name', 'purchase_channel_name', 'purchase_channel_id',
    'purchase_channel_type', 'purchase_channel_operator_id', 'purchase_channel_operator_email',
    'purchase_id', 'purchase_billingAddress_country',
    'purchase_billingAddress_zipCode', 'purchase_billingAddress_streetNumber', 'purchase_billingAddress_city',
    'purchase_billingAddress_street', 'purchase_billingAddress_neighborhood', 'purchase_billingAddress_state',
    'purchase_user_firstName', 'purchase_user_lastName', 'purchase_user_documentType',
    'purchase_user_documentNumber', 'purchase_user_email', 'name', 'payment_interestRate', 'payment_interestAmount',
    'payment_terminalNumber', 'payment_method', 'payment_amount',
    'payment_authorizationCode', 'payment_merchantId', 'payment_id', 'payment_type', 'payment_uuid',
    'payment_instalments', 'payment_card_lastFourDigits', 'payment_card_firstSixDigits', 'payment_card_brand', 'payment_gatewayId',
    'payment_batchNumber', 'id', 'event_venue_country', 'event_venue_city', 'event_venue_name', 'event_venue_id',
    'event_venue_state', 'event_name', 'event_client_name', 'event_client_id', 'event_id', 'event_category_name',
    'event_category_id', 'operation', 'refund_date', 'refund_amount', 'refund_uuid', 'refund_gatewayId',
    'product_name', 'product_id', 'tickets_show_name', 'tickets_show_id',
    'tickets_show_startDate', 'tickets_id', 'tickets_sector_name', 'tickets_sector_id', 'rate_name', 'rate_id',
    'rate_category_name', 'rate_category_id', "lastUpdateSearch", 'lastUpdateSearchNext', 'lastMovementIdSearch', 'lastMovementIdNext', 'combo'
  ];

  const allRows = [];

  movements.forEach(movement => {
    const baseRow = ensureKeys(flattenObject(movement), headers);

    // Definindo combo como 0 por padrão
    let comboValue = 0;

    if (movement.tickets && Array.isArray(movement.tickets)) {
      // Se houver mais de um ticket, altere comboValue para 1
      if (movement.tickets.length > 1) {
        comboValue = 1;
      }
      movement.tickets.forEach(ticket => {
        const ticketRow = ensureKeys({
          ...baseRow,
          ...flattenObject(ticket, 'tickets'),
          combo: comboValue // Adicionando a coluna Combo
        }, headers);
        allRows.push(cleanData(ticketRow)); // combo deve estar no ticketRow
      });

    } else {
      allRows.push(cleanData({ ...baseRow, combo: comboValue })); // Adicionando a coluna Combo
    }

  });

  return clean(allRows);
};

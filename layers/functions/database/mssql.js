const sql = require('mssql');
const ssm = require("/opt/util/ssm");

const RDS_HOST = process.env.RDS_HOST;
const RDS_USER = process.env.RDS_USER;
const RDS_PASSWORD = process.env.RDS_PASSWORD;
const RDS_DATABASE = process.env.RDS_DATABASE;
const RDS_PORT = process.env.RDS_PORT;
const RDS_TABLE = process.env.RDS_TABLE;

let cachedParams;
let pool;

const init = async () => {

    //if (cachedParams) return cachedParams;

    const ssmParams = [RDS_HOST, RDS_USER, RDS_PASSWORD, RDS_DATABASE, RDS_PORT, RDS_TABLE];
    const params = await ssm.retrieveParams(ssmParams);

    if (params.InvalidParameters.length > 0) {
        console.error("SSM Error: ", params.InvalidParameters)
    }

    cachedParams = {
        host: params.Parameters.find((ssm) => ssm.Name === RDS_HOST).Value,
        user: params.Parameters.find((ssm) => ssm.Name === RDS_USER).Value,
        password: params.Parameters.find((ssm) => ssm.Name === RDS_PASSWORD).Value,
        database: params.Parameters.find((ssm) => ssm.Name === RDS_DATABASE).Value,
        port: parseInt(params.Parameters.find((ssm) => ssm.Name === RDS_PORT).Value),
        table: params.Parameters.find((ssm) => ssm.Name === RDS_TABLE).Value,
    };

    return cachedParams;
};

const connect = async () => {

    if (pool) return pool;

    try {

        const { host, user, password, database, port } = await init();
        pool = await sql.connect({
            user: user,
            password: password,
            server: host,
            database: database,
            port: port,
            options: {
                encrypt: true,
                trustServerCertificate: true
            },
            requestTimeout: 45000
        });
        return pool;
    } catch (ex) {
        console.error('Error connecting to MSSQL database');
        throw ex;
    }
}

exports.insertBatch = async (data) => {

    await connect();

    const query = `
        INSERT INTO ${cachedParams.table} (
            date, amount, item_id, item_type, ticketCount, concept, lastUpdate,
            purchase_deliveryMethod, purchase_ipAddress, purchase_channel_pointOfSale_id,
            purchase_channel_pointOfSale_name, purchase_channel_name, purchase_channel_id,
            purchase_channel_type, purchase_channel_operator_id, purchase_channel_operator_email,
            purchase_id, purchase_billingAddress_country, purchase_billingAddress_zipCode,
            purchase_billingAddress_streetNumber, purchase_billingAddress_city,
            purchase_billingAddress_street, purchase_billingAddress_neighborhood,
            purchase_billingAddress_state, purchase_user_firstName, purchase_user_lastName,
            purchase_user_documentType, purchase_user_documentNumber, purchase_user_email,
            name, payment_interestRate, payment_interestAmount, payment_terminalNumber,
            payment_method, payment_amount, payment_authorizationCode, payment_merchantId,
            payment_id, payment_type, payment_uuid, payment_instalments,
            payment_card_lastFourDigits, payment_card_firstSixDigits, payment_card_brand,
            payment_gatewayId, payment_batchNumber, Movement_id,
            event_venue_country, event_venue_city, event_venue_name, event_venue_id,
            event_venue_state, event_name, event_client_name, event_client_id,
            event_id, event_category_name, event_category_id, operation,
            refund_date, refund_amount, refund_uuid, refund_gatewayId,
            product_name, product_id, tickets_show_name, tickets_show_id,
            tickets_show_startDate, tickets_id, tickets_sector_name, tickets_sector_id,
            rate_name, rate_id, rate_category_name, rate_category_id,
            lastUpdateSearch, lastUpdateSearchNext, lastMovementIdSearch, lastMovementIdNext,
            combo, insertion_datetime
        ) VALUES (
            @date, @amount, @item_id, @item_type, @ticketCount, @concept, @lastUpdate,
            @purchase_deliveryMethod, @purchase_ipAddress, @purchase_channel_pointOfSale_id,
            @purchase_channel_pointOfSale_name, @purchase_channel_name, @purchase_channel_id,
            @purchase_channel_type, @purchase_channel_operator_id, @purchase_channel_operator_email,
            @purchase_id, @purchase_billingAddress_country, @purchase_billingAddress_zipCode,
            @purchase_billingAddress_streetNumber, @purchase_billingAddress_city,
            @purchase_billingAddress_street, @purchase_billingAddress_neighborhood,
            @purchase_billingAddress_state, @purchase_user_firstName, @purchase_user_lastName,
            @purchase_user_documentType, @purchase_user_documentNumber, @purchase_user_email,
            @name, @payment_interestRate, @payment_interestAmount, @payment_terminalNumber,
            @payment_method, @payment_amount, @payment_authorizationCode, @payment_merchantId,
            @payment_id, @payment_type, @payment_uuid, @payment_instalments,
            @payment_card_lastFourDigits, @payment_card_firstSixDigits, @payment_card_brand,
            @payment_gatewayId, @payment_batchNumber, @Movement_id,
            @event_venue_country, @event_venue_city, @event_venue_name, @event_venue_id,
            @event_venue_state, @event_name, @event_client_name, @event_client_id,
            @event_id, @event_category_name, @event_category_id, @operation,
            @refund_date, @refund_amount, @refund_uuid, @refund_gatewayId,
            @product_name, @product_id, @tickets_show_name, @tickets_show_id,
            @tickets_show_startDate, @tickets_id, @tickets_sector_name, @tickets_sector_id,
            @rate_name, @rate_id, @rate_category_name, @rate_category_id,
            @lastUpdateSearch, @lastUpdateSearchNext, @lastMovementIdSearch, @lastMovementIdNext,
            @combo, @insertion_datetime
        );`;

    try {
        for (const record of data) {
            const request = new sql.Request(pool);

            Object.entries(record).forEach(([key, value]) => {
                request.input(key, value);
            });

            await request.query(query);
        }

    } catch (ex) {
        console.error('Error in batch insert');
        throw ex;
    }
};

exports.clearTable = async () => {

    await connect();

    try {
        await pool.request().query(`TRUNCATE TABLE ${cachedParams.table}`);

    } catch (ex) {
        console.error('Error in clear table');
        throw ex;
    }
}

process.on('exit', async () => {
    if (pool) await pool.close();
});

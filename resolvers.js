import { db } from './database.js';

export const resolvers = {
    Query: {
        clientes: async () => await db.fetchAllClientes(),
    },
    Cliente: {
        //Solución no optimizada (N+1)
        // facturas: async (parent) => {
        //     return await db.fetchFacturasByClienteId(parent.id);
        // }

        //Solución optimizada
        facturas: (parent, _args, context) => {
            return context.loaders.facturasByClienteId.load(parent.id)
        },

    }
}
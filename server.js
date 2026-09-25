import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import DataLoader from 'dataloader';

import { db } from './database.js';
import { resolvers } from './resolvers.js';

// -----------------------------------------------------------------------------
// 1. DEFINICIÓN DEL ESQUEMA (Schema-First)
//    El contrato SDL vive en un archivo dedicado: schema.graphql
// -----------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const typeDefs = readFileSync(join(__dirname, 'schema.graphql'), 'utf-8');

// -----------------------------------------------------------------------------
// 2. FÁBRICA DE LOADERS
//    Se crea una instancia NUEVA por cada petición (ver context más abajo).
//    Instanciarlo de forma global filtraría datos/caché entre usuarios.
//    El nombre 'facturasByClienteId' debe coincidir con el que usa resolvers.js.
// -----------------------------------------------------------------------------
function crearLoaders() {
  return {
    facturasByClienteId: new DataLoader(async (clienteIds) => {
      // La función batch recibe TODAS las llaves acumuladas en el tick y
      // devuelve un arreglo alineado 1:1 con el orden de clienteIds.
      return await db.fetchFacturasByClienteIdsBatch(clienteIds);
    }),
  };
}

// -----------------------------------------------------------------------------
// 3. INICIALIZACIÓN DEL SERVIDOR
// -----------------------------------------------------------------------------
const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  // El contexto se ejecuta por CADA petición HTTP entrante:
  // aquí garantizamos aislamiento y caché per-request del DataLoader.
  context: async () => ({
    loaders: crearLoaders(),
  }),
});

console.log(`🚀 Servidor Académico listo en: ${url}`);

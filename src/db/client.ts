// Re-use a single PrismaClient to avoid too many DB Connections
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management 
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PAID';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "stripeChargeId" TEXT;

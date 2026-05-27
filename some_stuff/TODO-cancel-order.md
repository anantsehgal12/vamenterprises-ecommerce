# TODO: Add Cancel Order Functionality

## Steps
- [ ] Update Prisma schema to add cancelReason and cancelDescription fields to Order model
- [ ] Run Prisma migration to apply schema changes
- [ ] Update API endpoint /api/orders/[id]/route.ts to add PATCH method for cancelling orders
- [ ] Update my-orders/page.tsx to add Cancel Order button and popup dialog
- [ ] Create cancel order popup component with reason selection and description textarea
- [ ] Test the cancel order functionality

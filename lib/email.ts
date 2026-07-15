import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail(
  to: string,
  orderId: string,
  orderDetails: any
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Vam Enterprises <info@vamenterprises.co.in>', // Replace with your verified domain
      to: [to],
      subject: `Order Confirmation - Order #${orderId}`,
      bcc: `vs@anantsales.in`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Order Confirmation</h1>
          <p>Thank you for your order! Here are the details:</p>

          <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
            <h2>Order #${orderId}</h2>
            <p><strong>Total Amount:</strong> ₹${orderDetails.totalAmount}</p>
            <p><strong>Order Date:</strong> ${new Date(orderDetails.createdAt).toLocaleDateString()}</p>
          </div>

          <h3>Order Items:</h3>
          <ul>
            ${orderDetails.items.map((item: any) => `
              <li>
                <strong>${item.product.name}</strong> - Quantity: ${item.quantity} - Price: ₹${item.price}
              </li>
            `).join('')}
          </ul>

          <p>If you have any questions, please contact our support team at <strong>+91 90263 44433</strong>.</p>

          <p>Best regards,<br>Vam Enteprises</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

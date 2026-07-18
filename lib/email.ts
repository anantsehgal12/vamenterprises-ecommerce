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



export async function sendCustomOrderEmail(
  to: string,
  customOrder: {
    title: string;
    description?: string;
    expiresAt?: string | null;
    totalAmount: number;
    link: string;
    items: {
      name: string;
      variant?: string;
      quantity: number;
      price: number;
    }[];
  }
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "VAM Enterprises <info@vamenterprises.co.in>",
      to: [to],
      bcc: "vs@anantsales.in",
      subject: `Your Custom Order - ${customOrder.title}`,

      html: `
      <div style="font-family:Arial,sans-serif;background:#f7f7f7;padding:30px;">
        <div style="max-width:650px;margin:auto;background:white;border-radius:14px;overflow:hidden;border:1px solid #e5e5e5">

          <div style="background:#4ca626;padding:28px;text-align:center;color:white">
            <h1 style="margin:0;font-size:28px;">VAM Enterprises</h1>
            <p style="margin-top:8px;font-size:15px;">
              A custom order has been prepared for you.
            </p>
          </div>

          <div style="padding:30px">

            <h2 style="margin-top:0">${customOrder.title}</h2>

            ${
              customOrder.description
                ? `<p style="color:#555">${customOrder.description}</p>`
                : ""
            }

            <table width="100%" cellpadding="10" style="border-collapse:collapse;margin-top:25px">
              <thead>
                <tr style="background:#fafafa">
                  <th align="left">Product</th>
                  <th align="center">Qty</th>
                  <th align="right">Price</th>
                </tr>
              </thead>

              <tbody>

              ${customOrder.items
                .map(
                  (item) => `
                <tr style="border-top:1px solid #eee">
                  <td>
                    <strong>${item.name}</strong>
                    ${
                      item.variant
                        ? `<br><small style="color:#666">${item.variant}</small>`
                        : ""
                    }
                  </td>

                  <td align="center">${item.quantity}</td>

                  <td align="right">
                    ₹${item.price.toFixed(2)}
                  </td>
                </tr>
              `
                )
                .join("")}

              </tbody>
            </table>

            <div style="margin-top:25px;padding:20px;background:#f8f8f8;border-radius:10px">
              <strong>Total Amount:</strong>

              <span style="float:right;font-size:18px;color:#4ca626;font-weight:bold">
                ₹${customOrder.totalAmount.toFixed(2)}
              </span>
            </div>

            ${
              customOrder.expiresAt
                ? `
            <p style="margin-top:20px;color:#c0392b">
              This custom order expires on
              <strong>${new Date(
                customOrder.expiresAt
              ).toLocaleString()}</strong>.
            </p>
            `
                : ""
            }

            <div style="text-align:center;margin-top:35px">

              <a
                href="${customOrder.link}"
                style="
                  display:inline-block;
                  background:#4ca626;
                  color:white;
                  text-decoration:none;
                  padding:16px 34px;
                  border-radius:10px;
                  font-weight:bold;
                "
              >
                Complete Your Order
              </a>

            </div>

            <p style="margin-top:35px;color:#666">
              Need help? Contact us at
              <strong>+91 90263 44433</strong>.
            </p>

          </div>

        </div>
      </div>
      `,
    });

    if (error) {
      console.error(error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
}
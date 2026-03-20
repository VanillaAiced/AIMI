import React from 'react';
import { Alert } from 'react-bootstrap';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const PayPal = ({ amount = '29.99', onSuccess, onError, onCancel }) => {
	const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;

	if (!clientId) {
		return (
			<Alert variant="danger" className="mb-3">
				PayPal is not configured. Add REACT_APP_PAYPAL_CLIENT_ID in your .env file and restart the app.
			</Alert>
		);
	}

	return (
		<PayPalScriptProvider
			options={{
				'client-id': clientId,
				currency: 'USD',
				intent: 'capture',
			}}
		>
			<PayPalButtons
				style={{ layout: 'vertical', shape: 'rect', label: 'paypal' }}
				createOrder={(data, actions) => {
					return actions.order.create({
						purchase_units: [
							{
								amount: {
									currency_code: 'USD',
									value: String(amount),
								},
								description: 'AIMI Schedule Generation Service',
							},
						],
					});
				}}
				onApprove={async (data, actions) => {
					try {
						const details = await actions.order.capture();
						if (onSuccess) {
							onSuccess(details);
						}
					} catch (err) {
						if (onError) {
							onError(err);
						}
					}
				}}
				onCancel={(data) => {
					if (onCancel) {
						onCancel(data);
					}
				}}
				onError={(err) => {
					if (onError) {
						onError(err);
					}
				}}
			/>
		</PayPalScriptProvider>
	);
};

export default PayPal;

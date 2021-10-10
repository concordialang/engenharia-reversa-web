import { ChromeMock } from './ChromeMock';

describe('ChromeMock', () => {
	it('listeners receive message and send response successfully', () => {
		const chromeMock = new ChromeMock();

		const responseMessage = 'Response Sent';
		const listenerFunction = jest.fn(function (message, sender, sendResponse) {
			sendResponse(responseMessage);
		});
		chromeMock.runtime.onMessage.addListener(listenerFunction);

		const message = { foo: 'bar' };
		const responseCallback = jest.fn(function (response) {});
		chromeMock.runtime.sendMessage(message, responseCallback);
		expect(listenerFunction.mock.calls.length).toBe(1);
		expect(listenerFunction.mock.calls[0][0]).toBe(message);

		expect(responseCallback.mock.calls.length).toBe(1);
		expect(responseCallback.mock.calls[0][0]).toBe(responseMessage);
	});
});

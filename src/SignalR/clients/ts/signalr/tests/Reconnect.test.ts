// Copyright (c) .NET Foundation. All rights reserved.
// Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.

// import { HubConnection } from "../src/HubConnection";

// function createHubConnection(connection: IConnectionThisIsFake, logger?: ILogger | null, protocol?: IHubProtocol | null) {
//     return HubConnection.create(connection, logger || NullLogger.instance, protocol || new JsonHubProtocol());
// }

import { HttpResponse } from "../src/HttpClient";
import { HttpConnection, INegotiateResponse } from "../src/HttpConnection";
import { IHttpConnectionOptions } from "../src/IHttpConnectionOptions";
import { HttpTransportType, TransferFormat } from "../src/ITransport";
import { NullLogger } from "../src/Loggers";
import { WebSocketConstructor } from "../src/Polyfills";

import { VerifyLogger } from "./Common";
import { TestHttpClient } from "./TestHttpClient";
import { TestCloseEvent, TestErrorEvent, TestEvent, TestWebSocket } from "./TestWebSocket";
import { PromiseSource } from "./Utils";

const commonOptions: IHttpConnectionOptions = {
    logger: NullLogger.instance,
};

const defaultConnectionId = "abc123";
const defaultNegotiateResponse: INegotiateResponse = {
    availableTransports: [
        { transport: "WebSockets", transferFormats: ["Text", "Binary"] },
        { transport: "ServerSentEvents", transferFormats: ["Text"] },
        { transport: "LongPolling", transferFormats: ["Text", "Binary"] },
    ],
    connectionId: defaultConnectionId,
};

// describe("HubConnection", () => {
describe("reconnect", () => {
    it("is not enabled by default", async () => {
        await VerifyLogger.run(async (loggerImpl) => {
            const options: IHttpConnectionOptions = {
                ...commonOptions,
                WebSocket: TestWebSocket as WebSocketConstructor,
                httpClient: new TestHttpClient()
                    .on("POST", () => defaultNegotiateResponse)
                    .on("GET", () => new HttpResponse(200))
                    .on("DELETE", () => new HttpResponse(202)),
                logger: loggerImpl,
                transport: HttpTransportType.WebSockets,
            } as IHttpConnectionOptions;

            const closePromise = new PromiseSource();
            let onreconnectingCalled = false;

            const connection = new HttpConnection("http://tempuri.org", options);

            TestWebSocket.webSocketSet = new PromiseSource();

            const startPromise = connection.start(TransferFormat.Text);

            await TestWebSocket.webSocketSet;
            await TestWebSocket.webSocket.openSet;

            TestWebSocket.webSocket.onopen(new TestEvent());

            await startPromise;

            connection.onclose = (e) => {
                closePromise.resolve();
            };

            connection.onreconnecting = (e) => {
                onreconnectingCalled = true;
            };

            TestWebSocket.webSocket.onclose(new TestCloseEvent());

            await closePromise;

            expect(onreconnectingCalled).toBe(false);

            // await expect(startPromise)
            //     .rejects
            //     .toThrow("Unable to connect to the server with any of the available transports. WebSockets failed: null ServerSentEvents failed: Error: 'ServerSentEvents' is disabled by the client. LongPolling failed: Error: 'LongPolling' is disabled by the client.");
        }, "Connection disconnected with error 'Error: WebSocket closed with status code: 0 ().'."); // ,
        // "Failed to start the transport 'WebSockets': null",
        // "Failed to start the transport 'ServerSentEvents': Error: 'ServerSentEvents' is disabled by the client.",
        // "Failed to start the transport 'LongPolling': Error: 'LongPolling' is disabled by the client.",
        // "Failed to start the connection: Error: Unable to connect to the server with any of the available transports. WebSockets failed: null ServerSentEvents failed: Error: 'ServerSentEvents' is disabled by the client. LongPolling failed: Error: 'LongPolling' is disabled by the client.");

        // await VerifyLogger.run(async (logger) => {
        //     const connection = new TestConnection();
        //     const hubConnection = createHubConnection(connection, logger);
        //     try {
        //         await hubConnection.start();
        //         expect(connection.sentData.length).toBe(1);
        //         expect(JSON.parse(connection.sentData[0])).toEqual({
        //             protocol: "json",
        //             version: 1,
        //         });
        //     } finally {
        //         await hubConnection.stop();
        //     }
        // });
    });
});
// });

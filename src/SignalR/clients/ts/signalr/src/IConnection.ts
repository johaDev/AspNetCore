// Copyright (c) .NET Foundation. All rights reserved.
// Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.

import { TransferFormat } from "./ITransport";

/** @private */
export interface IConnection {
    readonly features: any;

    start(transferFormat: TransferFormat): Promise<void>;
    send(data: string | ArrayBuffer): Promise<void>;
    stop(error?: Error): Promise<void>;
    connectionLost(error: Error): Promise<void>;
    continueReconnecting(error: Error): Promise<void>;

    onreceive: ((data: string | ArrayBuffer) => void) | null;
    onclose: ((error?: Error) => void) | null;

    onreconnecting: ((e?: Error) => void) | null;
    onreconnected: ((connectionId?: string) => void) | null;
}

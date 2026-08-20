import { NextRequest, NextResponse } from "next/server";
import { saveMT5Connection, recordAuditLog } from "@/lib/firebase/db-service";
import { MT5AccountConnection } from "@/types/mt5.types";

export async function POST(req: NextRequest) {
  try {
    const { userId, accountNumber, brokerServer, password } = await req.json();

    if (!accountNumber || !brokerServer) {
      return NextResponse.json(
        { error: "Account Number and Broker Server are required." },
        { status: 400 }
      );
    }

    const targetUserId = userId || "dev-trader-01";

    const connection: MT5AccountConnection = {
      id: `mt5-${accountNumber}`,
      userId: targetUserId,
      accountNumber: String(accountNumber),
      brokerServer: String(brokerServer),
      currency: "USD",
      leverage: 100,
      balance: 10000,
      equity: 10000,
      freeMargin: 10000,
      marginLevel: 0,
      status: "CONNECTED",
      lastSyncAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveMT5Connection(targetUserId, connection);

    await recordAuditLog(
      targetUserId,
      "MT5_ACCOUNT_CONNECTED",
      `Connected MT5 Account #${accountNumber} (${brokerServer})`,
      { accountNumber, brokerServer }
    );

    return NextResponse.json({
      success: true,
      message: `MetaTrader 5 Account #${accountNumber} successfully connected.`,
      connection,
    });
  } catch (error: any) {
    console.error("MT5 Connect Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect MT5 account" },
      { status: 500 }
    );
  }
}

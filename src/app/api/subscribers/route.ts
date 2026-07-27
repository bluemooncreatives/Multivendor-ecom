import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectMongo } from "@/lib/mongodb";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try { const {email}=z.object({email:z.email().max(254).transform((value)=>value.trim().toLowerCase())}).parse(await request.json());await connectMongo();await mongoose.connection.db!.collection("subscribers").updateOne({email},{$setOnInsert:{email,createdAt:new Date(),updatedAt:new Date()}},{upsert:true});return NextResponse.json({message:"You are subscribed."},{status:201}); }
  catch(error){if(error instanceof z.ZodError)return NextResponse.json({message:"Enter a valid email address."},{status:400});return NextResponse.json({message:"Subscription is temporarily unavailable."},{status:503});}
}

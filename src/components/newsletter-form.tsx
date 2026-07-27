"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form=event.currentTarget;const response=await fetch("/api/subscribers",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(form)))});const result=await response.json();setMessage(result.message||"Done.");if(response.ok)form.reset(); }
  return <form className="form-grid" onSubmit={submit}><input className="form-control" type="email" name="email" placeholder="Email address" maxLength={254} required/><button className="button">Subscribe</button>{message&&<small>{message}</small>}</form>;
}

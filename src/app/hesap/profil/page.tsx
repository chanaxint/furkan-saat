import { redirect } from "next/navigation";

/** The profile is the account's first page now. */
export default function AccountProfilePage() {
  redirect("/hesap");
}

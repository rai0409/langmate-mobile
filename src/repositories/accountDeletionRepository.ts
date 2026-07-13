import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth } from "../firebase/config";
import { getConfiguredDb } from "./firestoreHelpers";
export type DeletionRequest={status:string;scheduledFor?:{toDate():Date}};
function uid(){const value=auth?.currentUser?.uid;if(!value)throw new Error("Sign in again.");return value;}
export async function createDeletionRequest(){const id=uid();await setDoc(doc(getConfiguredDb(),"accountDeletionRequests",id),{uid:id,requestId:id,status:"requested",requestedBy:id,reasonCategory:"user_requested",retentionPolicyVersion:"draft-1",requestedAt:serverTimestamp(),updatedAt:serverTimestamp()});}
export async function cancelDeletionRequest(){const id=uid();await updateDoc(doc(getConfiguredDb(),"accountDeletionRequests",id),{status:"cancelled",cancelledAt:serverTimestamp(),updatedAt:serverTimestamp()});}
export function listenDeletionRequest(cb:(v:DeletionRequest|null)=>void){const id=uid();return onSnapshot(doc(getConfiguredDb(),"accountDeletionRequests",id),s=>cb(s.exists()?s.data() as DeletionRequest:null));}

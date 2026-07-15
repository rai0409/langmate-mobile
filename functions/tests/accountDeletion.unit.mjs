import assert from "node:assert/strict";
import {backoffMs,canClaimDeletion,MAX_ATTEMPTS} from "../lib/accountDeletionProcessor.js";
assert.equal(backoffMs(1),30000);assert.equal(backoffMs(99),3600000);assert.equal(MAX_ATTEMPTS,5);assert.equal(canClaimDeletion({status:"completed"}),false);assert.equal(canClaimDeletion({status:"cancelled"}),false);assert.equal(canClaimDeletion({status:"scheduled",nextAttemptAt:{toMillis:()=>0}}),true);console.log("PASS account deletion unit tests");

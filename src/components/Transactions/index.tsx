import { useCallback } from "react";
import { useCustomFetch } from "src/hooks/useCustomFetch";
import { SetTransactionApprovalParams } from "src/utils/types";
import { TransactionPane } from "./TransactionPane";
import {
  SetTransactionApprovalFunction,
  TransactionsComponent,
} from "./types";

export const Transactions: TransactionsComponent = ({
  transactions,
  transactionApprovalStates,
  onApprovalToggle,
}) => {
  const { fetchWithoutCache, loading } = useCustomFetch();

  const setTransactionApproval = useCallback<SetTransactionApprovalFunction>(
    async ({ transactionId, newValue }) => {
      await fetchWithoutCache<void, SetTransactionApprovalParams>(
        "setTransactionApproval",
        {
          transactionId,
          value: newValue,
        }
      );
      onApprovalToggle(transactionId); // Added this line to update the approval state
    },
    [fetchWithoutCache, onApprovalToggle] // Added onApprovalToggle as a dependency
  );

  if (transactions === null) {
    return <div className="RampLoading--container">Loading...</div>;
  }

  return (
    <div data-testid="transaction-container">
      {transactions.map((transaction) => (
        <TransactionPane
          key={transaction.id}
          transaction={transaction}
          loading={loading}
          setTransactionApproval={setTransactionApproval}
          approved={transactionApprovalStates[transaction.id]} // Pass the `approved` prop from the parent component
        />
      ))}
    </div>
  );
};

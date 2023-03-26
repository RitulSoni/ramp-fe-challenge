import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  //bug #5 code for fixing loadstates of employee and transtactions
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false) // Add this line
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false) // Add this line
 
  // Add this line to store the current employee ID
 const [currentEmployeeId, setCurrentEmployeeId] = useState(EMPTY_EMPLOYEE.id)

 const [transactionApprovalStates, setTransactionApprovalStates] = useState<Record<string, boolean>>({});

 

 const onApprovalToggle = (transactionId: string) => {
  setTransactionApprovalStates((prevState) => ({
    ...prevState,
    [transactionId]: !prevState[transactionId],
  }));
};


  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoadingEmployees(true);
    await employeeUtils.fetchAll();
    setIsLoadingEmployees(false);
  
    setIsLoadingTransactions(true);
    await paginatedTransactionsUtils.fetchAll();
    setIsLoadingTransactions(false);
  
    return paginatedTransactions?.data; // Return the fetched transactions here
  }, [employeeUtils, paginatedTransactionsUtils, paginatedTransactions]);

  //edited this function to fix bug #3 where the page will crash when you select all employees after selecting a single employee
  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      setCurrentEmployeeId(employeeId); // Add this line to store the current employee ID
      if (employeeId === EMPTY_EMPLOYEE.id) {
        await loadAllTransactions()
      } else {
        paginatedTransactionsUtils.invalidateData()
        await transactionsByEmployeeUtils.fetchById(employeeId)
      }
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils, loadAllTransactions]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions().then((transactions) => {
        // Set the initial state of transactionApprovalStates here
        if (transactions) {
          const initialTransactionApprovalStates: Record<string, boolean> = {};
          transactions.forEach((transaction: any) => {
            initialTransactionApprovalStates[transaction.id] = transaction.approved;
          });
          setTransactionApprovalStates(initialTransactionApprovalStates);
        }
      });
    }
  }, [employeeUtils.loading, employees, loadAllTransactions]);

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoadingEmployees}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }

            await loadTransactionsByEmployee(newValue.id)
          }}
          disabled={paginatedTransactionsUtils.loading} // Add this line to disable the InputSelect while loading more data
        />

        <div className="RampBreak--l" />

       <div className="RampGrid">
       <Transactions
              transactions={transactions}
              transactionApprovalStates={transactionApprovalStates} // Add this line
              onApprovalToggle={onApprovalToggle}
          />
        {transactions !== null &&
          currentEmployeeId === EMPTY_EMPLOYEE.id && // Replace this condition with the new approach
          paginatedTransactions?.nextPage !== null && ( //these fix bug #6
            <button
              className="RampButton"
              disabled={isLoadingTransactions}
              onClick={async () => {
                await loadAllTransactions()
                }}
              >
                View More
              </button>
            )}
        </div>
      </main>
    </Fragment>
  )
}

import TransactionDocListPage from "../../components/transactions/TransactionDocListPage.jsx";
import {
  listStockTransfersRequest,
  completeStockTransferRequest,
} from "../../services/api.js";

const COLUMNS = [
  { key: "transferNo", label: "Transfer No", width: "14%", align: "center", sortable: true },
  { key: "transferDate", label: "Date", width: "12%", align: "center", type: "date", sortable: true },
  { key: "status", label: "Status", width: "12%", align: "center", sortable: true },
  { key: "action", label: "Action", width: "8%", align: "center" },
];

export default function StockTransferListPage() {
  return (
    <TransactionDocListPage
      title="Stock Transfers"
      backSegment="stores"
      listRequest={listStockTransfersRequest}
      postRequest={completeStockTransferRequest}
      columns={COLUMNS}
      docNoKey="transferNo"
      dateKey="transferDate"
    />
  );
}

import PoSupplierLookupModal from "./PoSupplierLookupModal.jsx";

/** Job worker selection — uses Supplier Master (subcontractor) records. */
export default function JwoJobWorkerLookupModal(props) {
  return (
    <PoSupplierLookupModal
      {...props}
      title="Select Job Worker"
      codeColumnLabel="JWR No."
      searchPlaceholder="Search job worker..."
    />
  );
}

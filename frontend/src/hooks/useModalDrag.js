import { useEffect, useRef, useState } from "react";

/**
 * Draggable modal: opens centered via flex overlay; after drag uses absolute positioning.
 * @param {{ open?: boolean }} [options] — pass `open` to re-center when modal is shown again
 */
export function useModalDrag(options = {}) {
  const { open = true } = options;
  const modalRef = useRef(null);
  /** null = flex-centered; { x, y } = free-positioned after drag */
  const [pos, setPos] = useState(null);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (open) setPos(null);
  }, [open]);

  function handleHeaderMouseDown(e) {
    if (e.target.closest("button") || e.target.closest("img")) return;
    const el = modalRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const origin = pos ?? { x: rect.left, y: rect.top };
    if (pos === null) setPos(origin);

    setDragging(true);
    dragOffset.current = {
      x: e.clientX - origin.x,
      y: e.clientY - origin.y,
    };
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging || pos === null) return;
      setPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const handleMouseUp = () => setDragging(false);

    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, pos]);

  const isFree = pos !== null;

  return {
    modalRef,
    overlayStyle: isFree
      ? { alignItems: "flex-start", justifyContent: "flex-start" }
      : undefined,
    modalStyle: {
      ...(isFree
        ? {
            position: "absolute",
            left: `${pos.x}px`,
            top: `${pos.y}px`,
          }
        : {}),
      margin: 0,
      cursor: dragging ? "grabbing" : "default",
    },
    handleHeaderMouseDown,
    dragging,
  };
}

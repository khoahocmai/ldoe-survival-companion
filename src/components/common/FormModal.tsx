import React, { useId } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface FormModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: React.ReactNode;
}

/** Standard add/edit dialog: fields in the body, Cancel / Save pinned to the footer. */
export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  title,
  onClose,
  onSave,
  saveLabel = 'Lưu',
  saveDisabled = false,
  maxWidth = 'lg',
  children,
}) => {
  // The footer sits outside the <form>, so the save button points at it by id: Enter in any field then submits too.
  const formId = useId();
  return (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    maxWidth={maxWidth}
    footer={
      <>
        <Button variant="secondary" onClick={onClose}>
          Hủy
        </Button>
        <Button type="submit" form={formId} disabled={saveDisabled}>
          {saveLabel}
        </Button>
      </>
    }
  >
    <form
      id={formId}
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!saveDisabled) onSave();
      }}
    >
      {children}
    </form>
  </Modal>
  );
};

export const FormRow: React.FC<{ children: React.ReactNode; cols?: 2 | 3 }> = ({ children, cols = 2 }) => (
  <div className={`grid gap-3 ${cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>{children}</div>
);

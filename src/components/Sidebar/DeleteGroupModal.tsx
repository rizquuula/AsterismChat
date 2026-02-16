import React from 'react';
import { Group } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface DeleteGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | undefined;
  onConfirm: () => void;
}

export function DeleteGroupModal({ isOpen, onClose, group, onConfirm }: DeleteGroupModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Group"
    >
      <div className="space-y-4">
        <p className="text-[15px] text-white">
          Are you sure you want to delete <span className="font-semibold">{group?.name}</span>?
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
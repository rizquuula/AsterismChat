import React, { useState } from 'react';
import { updateAsterismConfig } from '../../services/api';
import { JsonSchema } from '../../types';
import { AddItemModal } from './AddItemModal';

interface ConfigTreeProps {
  data: unknown;
  path: string;
  agentId: string;
  schema: JsonSchema | null;
  onUpdate: () => void;
}

function resolveRef(ref: string, defs: Record<string, JsonSchema> | undefined): JsonSchema | null {
  if (!defs) return null;
  const refName = ref.replace('#/$defs/', '');
  return defs[refName] || null;
}

function getSchemaForPath(schema: JsonSchema | null, path: string): JsonSchema | null {
  if (!schema || !path) return schema;
  
  const parts = path.split('.').filter(p => !p.match(/^\[\d+\]$/));
  let current: JsonSchema | undefined = schema;
  
  for (const part of parts) {
    if (!current?.properties) return current ?? null;
    current = current.properties[part];
    
    if (current?.$ref) {
      current = resolveRef(current.$ref, schema.$defs) ?? undefined;
    }
  }
  
  return current ?? null;
}

export function ConfigTree({ data, path, agentId, schema, onUpdate }: ConfigTreeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editValue, setEditValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const currentSchema = getSchemaForPath(schema, path);
  const isRequired = schema?.required?.includes(path.split('.').pop() || '') ?? false;

  const handleToggle = () => setIsExpanded(!isExpanded);

  const handleEditStart = () => {
    if (data !== null && data !== undefined) {
      setEditValue(String(data));
      setIsEditing(true);
    }
  };

  const handleEditSave = async () => {
    setIsSaving(true);
    try {
      let parsedValue: unknown = editValue;
      
      if (editValue === 'true') parsedValue = true;
      else if (editValue === 'false') parsedValue = false;
      else if (!isNaN(Number(editValue)) && editValue.trim() !== '') {
        parsedValue = Number(editValue);
      }
      
      const result = await updateAsterismConfig(agentId, path, parsedValue, 'set');
      if (result.success) {
        onUpdate();
      } else {
        console.error('Failed to update config:', result.error);
      }
    } catch (err) {
      console.error('Error saving config:', err);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleRemoveItem = async (item: unknown, _index: number) => {
    setIsSaving(true);
    try {
      const result = await updateAsterismConfig(agentId, path, item, 'remove');
      if (result.success) {
        onUpdate();
      } else {
        console.error('Failed to remove item:', result.error);
      }
    } catch (err) {
      console.error('Error removing item:', err);
    } finally {
      setIsSaving(false);
      setConfirmDelete(null);
    }
  };

  if (data === null || data === undefined) {
    return null;
  }

  if (Array.isArray(data)) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={handleToggle}
            className="flex items-center gap-2 text-[14px] font-medium text-[var(--text-primary)]"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>{path.split('.').pop()} [{data.length} items]</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2 py-1 text-[12px] text-[var(--accent-success)] hover:bg-[var(--accent-success)]/10 rounded transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </div>
        
        {currentSchema?.description && (
          <p className="text-[11px] text-[var(--text-tertiary)] ml-6 -mt-1">{currentSchema.description}</p>
        )}
        
        {isExpanded && (
          <div className="ml-4 space-y-2 border-l-2 border-[var(--border)] pl-3">
            {data.map((item, index) => (
              <ArrayItemCard
                key={index}
                item={item}
                index={index}
                parentPath={`${path}[${index}]`}
                agentId={agentId}
                schema={schema}
                onUpdate={onUpdate}
                confirmDelete={confirmDelete}
                setConfirmDelete={setConfirmDelete}
                onRemove={handleRemoveItem}
                isSaving={isSaving}
              />
            ))}
          </div>
        )}
        
        {showAddModal && currentSchema?.items && (
          <AddItemModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={async (newItem: unknown) => {
              const result = await updateAsterismConfig(agentId, path, newItem, 'append');
              if (result.success) {
                onUpdate();
                setShowAddModal(false);
              } else {
                console.error('Failed to add item:', result.error);
              }
            }}
            schema={currentSchema.items!}
            rootSchema={schema!}
          />
        )}
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    const fieldName = path.split('.').pop() || '';
    
    return (
      <div className="space-y-2">
        <button
          onClick={handleToggle}
          className="flex items-center gap-2 text-[14px] font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="uppercase tracking-wide">
            {fieldName}
            {isRequired && <span className="text-[var(--accent-error)] ml-1">*</span>}
          </span>
        </button>
        
        {currentSchema?.description && (
          <p className="text-[11px] text-[var(--text-tertiary)] ml-6 -mt-1">{currentSchema.description}</p>
        )}
        
        {isExpanded && (
          <div className="ml-4 space-y-2 border-l-2 border-[var(--border)] pl-3">
            {entries.map(([key, value]) => (
              <ConfigTree
                key={key}
                data={value}
                path={path ? `${path}.${key}` : key}
                agentId={agentId}
                schema={schema}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const displayValue = String(data);
  const isSensitive = path.toLowerCase().includes('api_key') || path.toLowerCase().includes('password');

  return (
    <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-[var(--bg-tertiary)] group">
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[var(--text-secondary)] font-mono">
          {path.split('.').pop()}
          {isRequired && <span className="text-[var(--accent-error)]">*</span>}:
        </span>
        
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="px-2 py-1 text-[13px] bg-[var(--bg-primary)] border border-[var(--border)] rounded text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
              autoFocus
              disabled={isSaving}
            />
            <button
              onClick={handleEditSave}
              disabled={isSaving}
              className="p-1 text-[var(--accent-success)] hover:bg-[var(--accent-success)]/10 rounded"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={handleEditCancel}
              disabled={isSaving}
              className="p-1 text-[var(--accent-error)] hover:bg-[var(--accent-error)]/10 rounded"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <span className="text-[13px] text-[var(--text-primary)] font-mono">
            {isSensitive ? '***' : displayValue}
          </span>
        )}
      </div>
      
      {!isEditing && (
        <button
          onClick={handleEditStart}
          className="p-1 opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-all"
          title="Edit value"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface ArrayItemCardProps {
  item: unknown;
  index: number;
  parentPath: string;
  agentId: string;
  schema: JsonSchema | null;
  onUpdate: () => void;
  confirmDelete: number | null;
  setConfirmDelete: (index: number | null) => void;
  onRemove: (item: unknown, index: number) => void;
  isSaving: boolean;
}

function ArrayItemCard({ 
  item, 
  index, 
  parentPath, 
  agentId, 
  schema, 
  onUpdate,
  confirmDelete,
  setConfirmDelete,
  onRemove,
  isSaving,
}: ArrayItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (typeof item === 'object' && item !== null) {
    return (
      <div className="bg-[var(--bg-tertiary)] rounded-lg overflow-hidden group">
        <div className="flex items-center justify-between px-3 py-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors flex-1"
          >
            <svg
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-[var(--text-secondary)]">[{index}]</span>
            {typeof item === 'object' && item !== null && 'name' in item && (
              <span className="text-[var(--accent-primary)]">{(item as Record<string, unknown>).name as string}</span>
            )}
          </button>
          {confirmDelete === index ? (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-[var(--text-secondary)] mr-1">Confirm?</span>
              <button
                onClick={() => onRemove(item, index)}
                disabled={isSaving}
                className="px-2 py-1 text-[11px] text-[var(--accent-error)] hover:bg-[var(--accent-error)]/20 rounded"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-2 py-1 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(index)}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-error)] opacity-0 group-hover:opacity-100 transition-all"
              title="Remove item"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {isExpanded && (
          <div className="px-3 pb-3 border-t border-[var(--border)]">
            {Object.entries(item as Record<string, unknown>).map(([key, value]) => (
              <ConfigTree
                key={key}
                data={value}
                path={`${parentPath}.${key}`}
                agentId={agentId}
                schema={schema}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-1 px-2 bg-[var(--bg-tertiary)] rounded group">
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-[var(--text-tertiary)]">[{index}]</span>
        <span className="text-[13px] text-[var(--text-primary)] font-mono">{String(item)}</span>
      </div>
      {confirmDelete === index ? (
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-[var(--text-secondary)] mr-1">Confirm?</span>
          <button
            onClick={() => onRemove(item, index)}
            disabled={isSaving}
            className="px-2 py-1 text-[11px] text-[var(--accent-error)] hover:bg-[var(--accent-error)]/20 rounded"
          >
            Yes
          </button>
          <button
            onClick={() => setConfirmDelete(null)}
            className="px-2 py-1 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded"
          >
            No
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(index)}
          className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-error)] opacity-0 group-hover:opacity-100 transition-all"
          title="Remove item"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default ConfigTree;

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { JsonSchema } from '../../types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (value: unknown) => void;
  schema: JsonSchema;
  rootSchema: JsonSchema;
}

function getDefaultFromSchema(schema: JsonSchema): unknown {
  if (schema.default !== undefined) return schema.default;
  
  switch (schema.type) {
    case 'string':
      return '';
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      if (schema.properties) {
        const obj: Record<string, unknown> = {};
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          obj[key] = getDefaultFromSchema(propSchema);
        }
        return obj;
      }
      return {};
    default:
      return null;
  }
}

function resolveRef(ref: string, defs: Record<string, JsonSchema> | undefined): JsonSchema | null {
  if (!defs) return null;
  const refName = ref.replace('#/$defs/', '');
  return defs[refName] || null;
}

interface FormFieldProps {
  name: string;
  schema: JsonSchema;
  rootSchema: JsonSchema;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FormField({ name, schema, rootSchema, value, onChange }: FormFieldProps) {
  const resolvedSchema = schema.$ref ? resolveRef(schema.$ref, rootSchema.$defs) : schema;
  
  if (!resolvedSchema) {
    return (
      <div className="text-[var(--accent-error)]">Unable to resolve schema for {name}</div>
    );
  }

  const isRequired = resolvedSchema.required?.includes(name) ?? false;

  if (resolvedSchema.type === 'object' && resolvedSchema.properties) {
    return (
      <div className="space-y-3 p-3 bg-[var(--bg-tertiary)] rounded-lg">
        <div className="text-[13px] font-medium text-[var(--text-primary)] capitalize">
          {name}
          {isRequired && <span className="text-[var(--accent-error)] ml-1">*</span>}
        </div>
        {resolvedSchema.description && (
          <p className="text-[11px] text-[var(--text-tertiary)]">{resolvedSchema.description}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(resolvedSchema.properties).map(([key, propSchema]) => (
            <FormField
              key={key}
              name={key}
              schema={propSchema}
              rootSchema={rootSchema}
              value={(value as Record<string, unknown>)?.[key]}
              onChange={(newValue) => {
                onChange({ ...(value as object), [key]: newValue });
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (resolvedSchema.type === 'boolean') {
    return (
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--border)] bg-[var(--bg-primary)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
          />
          <span className="text-[13px] text-[var(--text-primary)]">
            {name}
            {isRequired && <span className="text-[var(--accent-error)] ml-1">*</span>}
          </span>
        </label>
        {resolvedSchema.description && (
          <span className="text-[11px] text-[var(--text-tertiary)]"> - {resolvedSchema.description}</span>
        )}
      </div>
    );
  }

  if (resolvedSchema.type === 'integer' || resolvedSchema.type === 'number') {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-[13px] text-[var(--text-primary)]">
          {name}
          {isRequired && <span className="text-[var(--accent-error)] ml-1">*</span>}
        </label>
        {resolvedSchema.description && (
          <span className="text-[11px] text-[var(--text-tertiary)]">{resolvedSchema.description}</span>
        )}
        <input
          type="number"
          value={value as number ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="px-3 py-2 text-[13px] bg-[var(--bg-primary)] border border-[var(--border)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px] text-[var(--text-primary)]">
        {name}
        {isRequired && <span className="text-[var(--accent-error)] ml-1">*</span>}
      </label>
      {resolvedSchema.description && (
        <span className="text-[11px] text-[var(--text-tertiary)]">{resolvedSchema.description}</span>
      )}
      <input
        type="text"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 text-[13px] bg-[var(--bg-primary)] border border-[var(--border)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
        placeholder={resolvedSchema.title || name}
      />
    </div>
  );
}

export function AddItemModal({ isOpen, onClose, onAdd, schema, rootSchema }: AddItemModalProps) {
  const [formData, setFormData] = useState<unknown>(() => getDefaultFromSchema(schema));

  const handleSubmit = () => {
    if (formData) {
      onAdd(formData);
    }
  };

  const handleChange = (value: unknown) => {
    setFormData(value);
  };

  if (!schema) return null;

  const resolvedSchema = schema.$ref ? resolveRef(schema.$ref, rootSchema.$defs) : schema;
  const isObjectSchema = resolvedSchema?.type === 'object' && resolvedSchema?.properties;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Item" size="default">
      <div className="space-y-4">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Fill in the details for the new item. Required fields are marked with *.
        </p>
        
        <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
          {isObjectSchema ? (
            Object.entries(resolvedSchema.properties || {}).map(([key, propSchema]) => (
              <FormField
                key={key}
                name={key}
                schema={propSchema}
                rootSchema={rootSchema}
                value={(formData as Record<string, unknown>)?.[key]}
                onChange={(newValue) => {
                  setFormData({ ...(formData as object), [key]: newValue });
                }}
              />
            ))
          ) : (
            <FormField
              name={resolvedSchema?.title || 'Value'}
              schema={schema}
              rootSchema={rootSchema}
              value={formData}
              onChange={handleChange}
            />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Add
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default AddItemModal;

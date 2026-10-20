/**
 * Edit text block.
 * Modernized using @dnd-kit/sortable instead of legacy react-dnd/volto-subblocks.
 * @module components/manage/Blocks/Form/EditBlock
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from 'semantic-ui-react';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import dragSVG from '@plone/volto/icons/drag.svg';
import trashSVG from '@plone/volto/icons/delete.svg';
import cx from 'classnames';

import Field from 'volto-form-block/components/Field';
import { getFieldName } from 'volto-form-block/components/utils';

export const EditBlock = ({
  id,
  index,
  data = {},
  selected,
  onSelect,
  onChange,
  onDelete,
}) => {
  const sortableId = String(data?.id || id || index);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
  };

  const fieldId = data?.id || id || sortableId;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cx('single-block subblock-draggable', {
        isDragging,
      })}
      onClick={onSelect}
      onFocus={onSelect}
      onKeyDown={onSelect}
    >
      <div
        className="dragsubblock"
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab' }}
      >
        <Icon className="drag handle" name={dragSVG} size="18px" />
      </div>

      {selected && !isDragging && (
        <Button
          type="button"
          icon
          basic
          onClick={(e) => {
            e.stopPropagation();
            onDelete && onDelete(index);
          }}
          className="delete-button"
          aria-label="delete"
        >
          <Icon name={trashSVG} size="18px" />
        </Button>
      )}

      <div>
        <Field
          {...data}
          name={getFieldName(data?.label, fieldId)}
          key={fieldId}
          isOnEdit={true}
          id={fieldId}
          field_id={fieldId}
          index={index}
          value={data?.field_type === 'static_text' ? data?.value : null}
          onLabelChange={(newLabel) => {
            onChange &&
              onChange(index, {
                ...data,
                label: newLabel,
                field_name: getFieldName(newLabel, fieldId),
              });
          }}
          onFocus={onSelect}
          onChange={
            data?.field_type === 'static_text'
              ? (_id, value) => onChange && onChange(index, { ...data, value })
              : () => {}
          }
        />
      </div>
    </div>
  );
};

export default EditBlock;

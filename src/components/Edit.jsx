import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Segment, Grid, Form, Button, TabPane, Tab } from 'semantic-ui-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { defineMessages, useIntl } from 'react-intl';
import config from '@plone/volto/registry';
import SidebarPortal from '@plone/volto/components/manage/Sidebar/SidebarPortal';

import EditBlock from 'volto-form-block/components/EditBlock';
import Sidebar from 'volto-form-block/components/Sidebar';
import DataTable from 'volto-form-block/components/DataTable';
import ValidateConfigForm from 'volto-form-block/components/ValidateConfigForm';

import './volto-subblocks.css';

const messages = defineMessages({
  addField: {
    id: 'Add field',
    defaultMessage: 'Add field',
  },
  default_submit_label: {
    id: 'form_default_submit_label',
    defaultMessage: 'Invia',
  },
  default_cancel_label: {
    id: 'form_default_cancel_label',
    defaultMessage: 'Annulla',
  },
  warning: {
    id: 'form_edit_warning',
    defaultMessage: 'Attenzione!',
  },
  warning_from: {
    id: 'form_edit_warning_from',
    defaultMessage:
      "Enter a field of type 'Sender E-mail'. If it is not present, or it is present but not filled in by the user, the sender address of the e-mail will be the one configured in the right sidebar.",
  },
  warning_enable_save: {
    id: 'warning_enable_save',
    defaultMessage:
      'Select the "Save Data" option in the right sidebar to enable storage and display of submitted data.',
  },
  form: {
    id: 'Form',
    defaultMessage: 'Form',
  },
  data: {
    id: 'Data',
    defaultMessage: 'data',
  },
});

export const Edit = (props) => {
  const {
    data = {},
    block,
    selected = false,
    onChangeBlock,
    openObjectBrowser,
    properties,
    metadata,
  } = props;

  const intl = useIntl();
  const [subIndexSelected, setSubIndexSelected] = useState(0);

  // Normalize subblocks ensuring every subblock has an id
  const subblocks = useMemo(() => {
    if (!data.subblocks || data.subblocks.length === 0) {
      return [];
    }
    return data.subblocks.map((s, idx) => ({
      ...s,
      id: s.id ? String(s.id) : `field-${idx}-${Date.now()}`,
    }));
  }, [data.subblocks]);

  // Set default_from if missing
  useEffect(() => {
    if (!data.default_from) {
      onChangeBlock(block, {
        ...data,
        default_from: 'noreply@plone.org',
        lastChange: Date.now(),
      });
    }
  }, [data, block, onChangeBlock]);

  // If there are no subblocks on mount, create an initial one
  useEffect(() => {
    if (!data.subblocks || data.subblocks.length === 0) {
      const initialId = Date.now().toString();
      onChangeBlock(block, {
        ...data,
        subblocks: [{ id: initialId, field_type: 'text' }],
        lastChange: Date.now(),
      });
      setSubIndexSelected(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = subblocks.findIndex(
          (item) => String(item.id) === String(active.id),
        );
        const newIndex = subblocks.findIndex(
          (item) => String(item.id) === String(over.id),
        );
        if (oldIndex !== -1 && newIndex !== -1) {
          const newSubblocks = arrayMove(subblocks, oldIndex, newIndex);
          onChangeBlock(block, {
            ...data,
            subblocks: newSubblocks,
            lastChange: Date.now(),
          });
          setSubIndexSelected(newIndex);
        }
      }
    },
    [subblocks, block, data, onChangeBlock],
  );

  const onChangeSubblock = useCallback(
    (index, updatedSubblock) => {
      const newSubblocks = [...subblocks];
      newSubblocks[index] = updatedSubblock;
      onChangeBlock(block, {
        ...data,
        subblocks: newSubblocks,
        lastChange: Date.now(),
      });
    },
    [subblocks, block, data, onChangeBlock],
  );

  const deleteSubblock = useCallback(
    (index) => {
      const newSubblocks = [
        ...subblocks.slice(0, index),
        ...subblocks.slice(index + 1),
      ];
      setSubIndexSelected((prev) =>
        prev === index ? null : prev > index ? prev - 1 : prev,
      );
      onChangeBlock(block, {
        ...data,
        subblocks: newSubblocks,
        lastChange: Date.now(),
      });
    },
    [subblocks, block, data, onChangeBlock],
  );

  const addSubblock = useCallback(() => {
    const id = Date.now().toString();
    const newBlock = { id, field_type: 'text' };
    const newSubblocks = [...subblocks, newBlock];
    onChangeBlock(block, {
      ...data,
      subblocks: newSubblocks,
      lastChange: Date.now(),
    });
    setSubIndexSelected(newSubblocks.length - 1);
  }, [subblocks, block, data, onChangeBlock]);

  if (__SERVER__) {
    return <div />;
  }

  const datatableEnabled =
    config.blocks.blocksConfig.form?.enableDatatableView;

  const sortableIds = subblocks.map((s) => String(s.id));

  return (
    <div className="public-ui">
      <ValidateConfigForm
        data={data}
        onEdit={true}
        onChangeBlock={(updatedData) => {
          onChangeBlock(block, updatedData);
        }}
      >
        <Segment>
          {(data.form_title || data.title) && (
            <h2>{data.form_title || data.title}</h2>
          )}
          {(data.form_description || data.description) && (
            <p className="description">
              {data.form_description || data.description}
            </p>
          )}

          <div className="volto-subblocks-wrapper">
            <Tab
              panes={[
                {
                  menuItem: intl.formatMessage(messages.form),
                  render: () => (
                    <TabPane>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={sortableIds}
                          strategy={verticalListSortingStrategy}
                        >
                          {subblocks.map((subblock, index) => (
                            <Form.Field key={subblock.id || index}>
                              <EditBlock
                                id={subblock.id}
                                index={index}
                                data={subblock}
                                selected={selected && subIndexSelected === index}
                                onSelect={() => setSubIndexSelected(index)}
                                onChange={onChangeSubblock}
                                onDelete={deleteSubblock}
                                openObjectBrowser={openObjectBrowser}
                              />
                            </Form.Field>
                          ))}
                        </SortableContext>
                      </DndContext>

                      {selected && (
                        <Form.Field>
                          <Button
                            type="button"
                            onClick={addSubblock}
                            className="add-element"
                          >
                            {intl.formatMessage(messages.addField)}
                          </Button>
                        </Form.Field>
                      )}

                      <Grid columns={1} padded="vertically">
                        <Grid.Row>
                          <Grid.Column textAlign="center">
                            {data?.show_cancel && (
                              <Button secondary>
                                {data.cancel_label ||
                                  intl.formatMessage(
                                    messages.default_cancel_label,
                                  )}
                              </Button>
                            )}
                            <Button primary>
                              {data.submit_label ||
                                intl.formatMessage(
                                  messages.default_submit_label,
                                )}
                            </Button>
                          </Grid.Column>
                        </Grid.Row>
                      </Grid>
                    </TabPane>
                  ),
                },
                ...(datatableEnabled
                  ? [
                      {
                        menuItem: intl.formatMessage(messages.data),
                        render: () => (
                          <TabPane className="container">
                            {data.store ? (
                              <DataTable
                                properties={properties}
                                blockId={block}
                                removeDataAfterDays={
                                  data.remove_data_after_days
                                }
                              />
                            ) : (
                              <p>
                                {intl.formatMessage(
                                  messages.warning_enable_save,
                                )}
                              </p>
                            )}
                          </TabPane>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </Segment>
      </ValidateConfigForm>

      <SidebarPortal selected={selected}>
        <Sidebar
          {...props}
          data={data}
          block={block}
          onChangeBlock={onChangeBlock}
          onChangeSubBlock={onChangeSubblock}
          selected={subIndexSelected}
          setSelected={setSubIndexSelected}
          openObjectBrowser={openObjectBrowser}
          properties={metadata?.['@id'] ? metadata : properties}
        />
      </SidebarPortal>
    </div>
  );
};

Edit.propTypes = {
  data: PropTypes.objectOf(PropTypes.any),
  block: PropTypes.string,
  selected: PropTypes.bool,
  onChangeBlock: PropTypes.func,
  openObjectBrowser: PropTypes.func,
  properties: PropTypes.objectOf(PropTypes.any),
  metadata: PropTypes.objectOf(PropTypes.any),
};

export default React.memo(Edit);

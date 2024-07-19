import { AppEvents, declareIndexPlugin, ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import { sortTodos } from './todo_sort';
import { onTodoCompleted } from './todo_completed_handler';

async function onActivate(plugin: ReactRNPlugin) {

  await plugin.settings.registerStringSetting({
    id: 'todoTagName',
    title: 'Todo tag name',
    defaultValue: 'Todo',
  });

  await plugin.settings.registerStringSetting({
    id: 'dueDatePropertyeName',
    title: 'Due date property name',
    defaultValue: 'Due date',
  });

  await plugin.app.registerCommand({
    id: "sort-todos",
    name: "Sort todos",
    description: "Sort todos",
    action: async () => {
      await sortTodos(plugin)
    },
  });

  plugin.event.addListener(AppEvents.GlobalRemChanged, undefined, async (data) => {
    await onTodoCompleted(plugin, data);
  })
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);

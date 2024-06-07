import { declareIndexPlugin, ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import { sortTodos } from './todo_sort';

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
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);

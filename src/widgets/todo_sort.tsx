import { Rem, RNPlugin } from '@remnote/plugin-sdk';
import { getTagProperties, mapRemsToRemsWithDate } from './helper';


export async function sortTodos(plugin: RNPlugin): Promise<void> {
  const parentRem = await plugin.focus.getFocusedRem();

  if (parentRem != undefined) {
    const todoTagName: string = await plugin.settings.getSetting("todoTagName");
    const dueDatePropertyName: string = await plugin.settings.getSetting("dueDatePropertyeName");
    let todos = await parentRem.getChildrenRem()
    let remsWithDate = await mapRemsToRemsWithDate(plugin, todoTagName, dueDatePropertyName, todos);

    remsWithDate.sort((a, b) => {
      return a.dueDate.valueOf() - b.dueDate.valueOf() || a.isMarker - b.isMarker
    })

    let deleteParentPromises = [];
    for (const rem of remsWithDate) {
      deleteParentPromises.push(rem.rem.setParent(null));
    }

    await Promise.all(deleteParentPromises)

    for (const rem of remsWithDate) {
      await rem.rem.setParent(parentRem._id);
    }
  }
}

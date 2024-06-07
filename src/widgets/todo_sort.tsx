import { Rem, RNPlugin } from '@remnote/plugin-sdk';
import { getTagProperties } from './helper';

export interface RemWithTodoDate {
  rem: Rem,
  dueDate: Date
}

export async function sortTodos(plugin: RNPlugin): Promise<void> {
  const parentRem = await plugin.focus.getFocusedRem();

  if (parentRem != undefined) {
    const todoTagName: string = await plugin.settings.getSetting("todoTagName");
    const dueDatePropertyName: string = await plugin.settings.getSetting("dueDatePropertyeName");
    let todos = await parentRem.getChildrenRem()
    let remsWithDate = []
    for (const todo of todos!!) {
      if (await todo.isTodo()) {
        let properties = await getTagProperties(plugin, todoTagName, todo._id);
        let dateProp = properties?.find(
            (props) => props.tagPropertyName == dueDatePropertyName)

        if (dateProp != null) {
          remsWithDate.push({
            rem: todo,
            dueDate: Date.parse(dateProp.tagPropertyValueString)
          })
        }
      }
    }

    remsWithDate.sort((a, b) => {
      return a.dueDate.valueOf() - b.dueDate.valueOf()
    })
    for (const rem of remsWithDate) {
      await rem.rem.setParent(null);
      await rem.rem.setParent(parentRem._id);
    }
  }
}

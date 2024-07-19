import { Rem, RemId, RichText, RichTextGlobalNameInterface, RNPlugin } from '@remnote/plugin-sdk';

export interface TagPropertyModel {
  tagName: string;
  tagPropertyName: string;
  tagPropertyRemId: string;
  tagPropertyValueRemId: string;
  tagPropertyValueString: string;
}

export async function getTagRem(plugin: RNPlugin, tagName: string): Promise<Rem | undefined> {
  let tagRem = await plugin.rem.findByName([tagName], null)
  if (tagName == undefined) {
    let tagsRem = await plugin.rem.findByName(["Tags"], null)
    tagRem = await plugin.rem.findByName([tagName], tagsRem!!._id)
  }
  return tagRem
}

export async function getTagProperties(plugin: RNPlugin, tagName: string, remId: RemId): Promise<TagPropertyModel[] | undefined> {
  let tagRem = await getTagRem(plugin, tagName);
  let tagChildren = await tagRem?.getChildrenRem();

  let rem = await plugin.rem.findOne(remId)
  if (rem !== undefined && tagRem !== undefined && tagChildren !== undefined) {
    let tagProperties: TagPropertyModel[] = [];
    for (const child of tagChildren!!) {
      let isProperty = await child.isProperty();
      if (isProperty) {
        let propertyValue = await rem?.getTagPropertyValue(child._id)
        let propertyValueRemId = '';
        let propertyValueString = '';

        if (propertyValue.length > 0) {
          if (typeof propertyValue[0] == 'string') {
            propertyValueString = propertyValue[0]
          } else if ('_id' in propertyValue[0]) {
            propertyValueRemId = (propertyValue[0] as RichTextGlobalNameInterface)._id!!
            let valueRem = await plugin.rem.findOne(propertyValueRemId)
            if (valueRem != undefined) {
              propertyValueString = valueRem.text!!.toString();
            }
          }
        }
        tagProperties.push({
          tagName: tagName,
          tagPropertyName: child.text!!.toString(),
          tagPropertyRemId: child._id.toString(),
          tagPropertyValueRemId: propertyValueRemId,
          tagPropertyValueString: propertyValueString
        })
      }

    }
    return tagProperties
  }
  return undefined
}


export interface RemWithTodoDate {
  rem: Rem,
  dueDate: number,
  isMarker: number,
  index: number,
}

export async function mapRemsToRemsWithDate(
    plugin: RNPlugin,
    todoTagName: string,
    dueDatePropertyName: string,
    todos: Rem[]): Promise<RemWithTodoDate[]> {
  let remsWithDate = []
  let index = 0;
  for (const todo of todos!!) {
    if (await todo.isTodo()) {
      let properties = await getTagProperties(plugin, todoTagName, todo._id);
      let dateProp = properties?.find(
          (props) => props.tagPropertyName == dueDatePropertyName)

      let markerProp = properties?.find(
          (props) => props.tagPropertyName == "marker")
      let markerPropValue = markerProp?.tagPropertyValueString;
      if (markerPropValue == null) {
        markerPropValue = '';
      }

      if (dateProp != null) {
        remsWithDate.push({
          rem: todo,
          dueDate: Date.parse(dateProp.tagPropertyValueString),
          isMarker: (markerPropValue == '' || markerPropValue == 'No') ? 0 : 1,
          index: index++
        } as RemWithTodoDate)
      }
    }
  }
  return remsWithDate;

}

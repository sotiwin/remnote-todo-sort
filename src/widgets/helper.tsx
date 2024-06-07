import { Rem, RemId, RichTextGlobalNameInterface, RNPlugin } from '@remnote/plugin-sdk';

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
          propertyValueRemId = (propertyValue[0] as RichTextGlobalNameInterface)._id!!
          let valueRem = await plugin.rem.findOne(propertyValueRemId)
          if (valueRem != undefined) {
            propertyValueString = valueRem.text!!.toString();
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

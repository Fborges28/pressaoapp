import * as React from 'react';
import { View, Text } from 'react-native';
import { List } from 'react-native-paper';

export type TAccordion = {
  id: string | number,
  title: string,
  items: {
    id: string | number,
    content: string
  }[]
}

type AccordionProps = {
  list: TAccordion[]
}

const Accordion = ({list}: AccordionProps) => {
  return (
    <List.AccordionGroup>
      {
        list.map(accordionItem => (
          <List.Accordion title={accordionItem.title} id={accordionItem.id} key={`${accordionItem.title}-${accordionItem.id}`}>
            {
              accordionItem.items.map(listItem => (
                <List.Item 
                  title={"Medição"} 
                  description={listItem.content} 
                  descriptionNumberOfLines={20}
                  style={{marginBottom: -30, padding: 0}}
                  descriptionStyle={{fontSize: 14, margin: 0, padding: 0}} 
                  key={`${listItem.content}-${listItem.id}`}
                />
              ))
            }
          </List.Accordion>
        ))
      }
      
    </List.AccordionGroup>
  );
};

export default Accordion;
export function selectedReferenceNode(app){
 const graph=app.graph;
 const candidates=[...Array.from(app.canvas?.selectedItems??[]),...Object.values(app.canvas?.selected_nodes??{})];
 return candidates.find(node=>node?.id!=null&&graph?.getNodeById(node.id)===node);
}

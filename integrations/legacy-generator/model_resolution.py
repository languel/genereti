"""Resolve installed model capabilities without loading Core ML packages."""
def required_models(mode, style='base'):
    turbo=mode in ('image','canny','depth','pose')
    required={'encoder','decoder','turbo_unet' if turbo else 'anime_unet' if style=='anime' else 'unet'}
    if mode in ('sketch','composite'):
        required.add('anime_controlled_unet' if style=='anime' else 'controlled_unet')
    if mode in ('canny','depth','pose'):
        required.update(('control_'+mode,'turbo_residual_unet'))
    if mode=='composite':required.update(('turbo_unet','turbo_residual_unet','control_canny'))
    if mode=='sdxs_mixer':required.update(('sdxs_sketch_control','anime_sdxs_residual_unet' if style=='anime' else 'sdxs_residual_unet'))
    return required


def resolve_resolution(catalog, current, mode, style='base', requested='auto'):
    required=required_models(mode,style)
    supported=sorted(int(size) for size,models in catalog.items() if required.issubset(models))
    if requested=='auto':
        if current in supported:return current
        if supported:return min(supported)
    elif int(requested) in supported:return int(requested)
    sizes=', '.join(f'{size}px' for size in supported) or 'none installed'
    raise ValueError(f'{mode} ({style}) does not support resolution {requested}. Available sizes: {sizes}. Choose auto or install matching model packages.')

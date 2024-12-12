import type { HttpContext } from '@adonisjs/core/http';
import Tool from '#models/tool';
import ToolsHelper from '#helpers/tools_helper'

export default class ToolsController {

    public async getTools({ response }: HttpContext) {
        const tools = await Tool.all();
        return response.json({ tools });
    }

    public async create({ view }: HttpContext) {
        return view.render('backend/tools/create');
    }

    public async store({ }: HttpContext) { }

    public async show({ }: HttpContext) { }

    public async edit({ view, params }: HttpContext) {
        const tool = await Tool.find(params.id)
        const schema = JSON.parse(tool?.schema || '{}')
        return view.render('backend/tools/edit', { tool, schema });
    }

    public async update({ session, response, params, request }: HttpContext) {
        const tool = await Tool.findOrFail(params.id)
        const toolsHelper = new ToolsHelper();

        tool.name = request.body().name;
        tool.description = request.body().description;
        tool.code = request.body().code;

        const propertyNames = request.input('property_name');
        const propertyTypes = request.input('property_type');
        const propertyDescriptions = request.input('property_description');
        const propertyRequired = request.input('property_required');

        let schema: any[] = [];
        if (propertyNames !== null && propertyNames !== undefined) {
            schema = await toolsHelper.createSchema(propertyNames, propertyTypes, propertyDescriptions, propertyRequired) || [];
        }
        tool.schema = JSON.stringify(schema);
        await tool.save();

        session.flash('success', 'Tool Updated Successfully')
        return response.redirect().back()
    }

    public async destroy({ session, params, response }: HttpContext) {
        const tool = await Tool.findOrFail(params.id)
        await tool.delete()

        session.flash('success', 'Tool Deleted Successfully')
        return response.redirect().back()
    }

    // public async toggle({ request, session, params, response, auth }: HttpContext) {
    //     const toolsHelper = this.toolsHelper;
    //     const toggleStatus = request.input('toggler');
    //     const conversationId = request.input('convId');
    //     if (auth.user?.id) {
    //         await toolsHelper.toggleTool({ toggleStatus, toolId: params.id, userId: auth.user?.id, conversationId });
    //     }
    //     return response.redirect().toRoute('tools.index')
    // }

    public async createTool({ response, request }: HttpContext) {
        const tool = new Tool();
        const toolsHelper = new ToolsHelper();

        tool.name = request.input('name')
        tool.description = request.input('description');
        tool.code = request.input('code');

        console.log("Tool time");
        const propertyNames = request.input('property_name');
        const propertyTypes = request.input('property_type');
        const propertyDescriptions = request.input('property_description');
        const propertyRequired = request.input('property_required');

        let schema: any[] = [];
        if (propertyNames !== null) {
            schema = await toolsHelper.createSchema(propertyNames, propertyTypes, propertyDescriptions, propertyRequired) || [];
        }
        tool.schema = JSON.stringify(schema);
        tool.code = request.body().code;
        await tool.save();

        return response.status(200).json({ message: 'Tool created successfully' });
    }

}

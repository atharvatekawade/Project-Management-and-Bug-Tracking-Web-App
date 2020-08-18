import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Dropdown } from 'semantic-ui-react'
import $ from 'jquery';

export default class Project extends Component {
    constructor(props){
        super(props);
        this.state={
            projects:[],
            project:'',
            s:[],
            status:''
        }
        this.handleChangeclient=this.handleChangeclient.bind(this);
        this.handleChangeemployee=this.handleChangeemployee.bind(this);
    }
    componentDidMount(){
        axios.get('/viewprojects')
            .then(res => this.setState({projects:res.data,s:[{key:'Yes',value:'Yes',text:'Yes'},{key:'No',value:'No',text:'No'}]}))       
    }

    handleChangeclient(e, data){
        console.log(data.value);
        this.setState({ project: data.value });
    }
    handleChangeemployee(e, data){
        console.log(data.value);
        this.setState({ status: data.value });
    }


    render(){
        return(
            <div>
                <hr />
                <div style={{marginLeft:"38%"}} className='mt-3'>
                    <div className="field">
                        <label><b>Search for Project:</b></label>
                        <Dropdown placeholder='Client' search selection options={this.state.projects} onChange={this.handleChangeclient} id='client' value={this.state.project} name='project' className='ml-2' />
                    </div>
                    <br />
                    <div className="field">
                        <label><b>Status:</b></label>
                        <Dropdown placeholder='Employee' search selection options={this.state.s} onChange={this.handleChangeemployee} id='employee' value={this.state.status} name='status' className='ml-2' />
                    </div>
                    <br />
                    {this.state.project.length > 0 && this.state.status.length > 0 &&
                        <a href={'/viewbug/'+this.state.project+'/'+this.state.status} className='btn btn-success' disabled>View Related Bugs >></a>
                    }
                    {(this.state.client.length*this.state.employee.length) === 0 &&
                        <a href='#' className='btn btn-success' disabled>>View Related Bugs >></a>
                    }
                    
                    <br />
                    <a href='/addbug'>Add New Bug</a>
                </div>
            </div>
        )
    }
}
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Dropdown } from 'semantic-ui-react'
import $ from 'jquery';

export default class Project extends Component {
    constructor(props){
        super(props);
        this.state={
            clients:[],
            client:'',
            employees:[],
            employee:'',
            c:[],
            d:[],
            a:[],
            b:[],
            c:0,
            perm:[],
            per:[]
        }
        this.handleChangeclient=this.handleChangeclient.bind(this);
        this.handleChangeemployee=this.handleChangeemployee.bind(this);
    }
    componentDidMount(){
        axios.get('/viewclients')
            .then((res) => {
                let arr=[]
                let ar=[];
                for(let i=0;i<res.data.length;i++){
                    let client={key:res.data[i].name,value:res.data[i].name,text:res.data[i].name};
                    arr.push(client);
                    ar.push(res.data[i].client_id)
                }
                this.setState({clients:arr,a:ar,per:arr});
                axios.get('/viewemployees')
                    .then((res) => {
                        let arr=[];
                        let ar=[];
                        for(let i=0;i<res.data.length;i++){
                            let client={key:res.data[i].name+'-'+res.data[i].branch,value:res.data[i].name+'-'+res.data[i].branch,text:res.data[i].name+'-'+res.data[i].branch};
                            arr.push(client);
                            ar.push(res.data[i].emp_id);
                        }
                        this.setState({employees:arr,b:ar,perm:arr});
                    })
                    axios.get('/verifyproject/client')
                        .then((res) => {
                            this.setState({c:res.data})
                            axios.get('/verifyproject/emp')
                                .then(res => this.setState({d:res.data}))
                        }
                    )

            })
            /*axios.get('/viewemployees')
            .then((res) => {
                let arr=[];
                let ar=[];
                for(let i=0;i<res.data.length;i++){
                    let client={key:res.data[i].name+'-'+res.data[i].branch,value:res.data[i].name+'-'+res.data[i].branch,text:res.data[i].name+'-'+res.data[i].branch};
                    arr.push(client);
                    ar.push(res.data[i].emp_id);
                }
            this.setState({employees:arr,b:ar});
            })
            axios.get('/verifyproject/client')
                .then(res => this.setState({c:res.data}))
            axios.get('/verifyproject/emp')
                .then(res => this.setState({d:res.data}))*/
    }

    handleChangeclient(e, data){
        console.log(data.value);
        let j=-1;
        for(let i=0;i<this.state.a.length;i++){
            if(this.state.per[i].value==data.value){
                j=i;
                break;
            }
        }
        console.log(this.state.c[this.state.a[j]]);
        this.setState({ client: data.value,employees:this.state.c[this.state.a[j]] });
    }
    handleChangeemployee(e, data){
        console.log(data.value);
        let j=-1;
        for(let i=0;i<this.state.b.length;i++){
            if(this.state.perm[i].value==data.value){
                j=i;
                break;
            }
        }
        console.log(this.state.d[this.state.b[j]]);
        this.setState({ employee: data.value,clients:this.state.d[this.state.b[j]] });
    }


    render(){
        return(
            <div>
                <div style={{marginLeft:"38%"}} className='mt-3'>
                    <div className="field">
                        <label><b>Search By Client Name:</b></label>
                        <Dropdown placeholder='Client' search selection options={this.state.clients} onChange={this.handleChangeclient} id='client' value={this.state.client} name='client' className='ml-2' />
                    </div>
                    <br />
                    <div className="field">
                        <label><b>Search By Employee Name:</b></label>
                        <Dropdown placeholder='Employee' search selection options={this.state.employees} onChange={this.handleChangeemployee} id='employee' value={this.state.employee} name='employee' className='ml-2' />
                    </div>
                    <br />
                    <br />
                    {this.state.client.length > 0 && this.state.employee.length > 0 &&
                        <a href={'/viewproject/'+this.state.client+'/'+this.state.employee} className='btn btn-success' disabled>View Project Information</a>
                    }
                    {(this.state.client.length*this.state.employee.length) === 0 &&
                        <a href='#' className='btn btn-success' disabled>View Project Information</a>
                    }
                    <br />
                    <a href='/addproject' className='mt-3 btn btn-primary' style={{position:"relative",top:"-47px",right:"-200px"}}>Add New Project >></a>
                </div>
            </div>
        )
    }
}